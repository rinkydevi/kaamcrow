package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/naveensiwach/task-management/internal/models"
)

// ErrNotFound is returned when a task does not exist.
var ErrNotFound = errors.New("not found")

// ErrForbidden is returned when the caller does not own the task.
var ErrForbidden = errors.New("forbidden")

type TaskRepository struct {
	db *pgxpool.Pool
}

func NewTaskRepository(db *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(ctx context.Context, userID string, req *models.CreateTaskRequest) (*models.Task, error) {
	if req.Status == "" {
		req.Status = models.StatusTodo
	}
	if req.Priority == "" {
		req.Priority = models.PriorityMedium
	}

	task := &models.Task{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO tasks (user_id, title, description, status, priority, due_date)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
		userID, req.Title, req.Description, req.Status, req.Priority, req.DueDate,
	).Scan(&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority, &task.DueDate, &task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return task, nil
}

func (r *TaskRepository) List(ctx context.Context, userID string, p *models.TaskListParams, adminAll bool) (*models.TaskListResponse, error) {
	filterArgs := []interface{}{}
	where := []string{}
	argIdx := 1

	if !adminAll {
		where = append(where, fmt.Sprintf("user_id = $%d", argIdx))
		filterArgs = append(filterArgs, userID)
		argIdx++
	}

	if p.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		filterArgs = append(filterArgs, p.Status)
		argIdx++
	}

	if p.Search != "" {
		where = append(where, fmt.Sprintf("title ILIKE $%d", argIdx))
		filterArgs = append(filterArgs, "%"+p.Search+"%")
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	allowedSort := map[string]bool{"due_date": true, "priority": true, "created_at": true, "title": true}
	sortBy := "created_at"
	if allowedSort[p.SortBy] {
		sortBy = p.SortBy
	}

	sortDir := "DESC"
	if strings.ToUpper(p.SortDir) == "ASC" {
		sortDir = "ASC"
	}

	orderExpr := sortBy
	if sortBy == "priority" {
		orderExpr = "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END"
	}

	if p.Limit <= 0 {
		p.Limit = 20
	}
	if p.Limit > 100 {
		p.Limit = 100
	}
	if p.Page <= 0 {
		p.Page = 1
	}
	offset := (p.Page - 1) * p.Limit

	// Two queries sent as one batch: the data query can early-exit after LIMIT rows
	// (no window function), while the count query is a cheap index-only scan.
	countQuery := "SELECT COUNT(*) FROM tasks " + whereClause
	dataQuery := fmt.Sprintf(
		`SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		 FROM tasks %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		whereClause, orderExpr, sortDir, argIdx, argIdx+1,
	)
	dataArgs := append(filterArgs, p.Limit, offset)

	batch := &pgx.Batch{}
	batch.Queue(countQuery, filterArgs...)
	batch.Queue(dataQuery, dataArgs...)

	br := r.db.SendBatch(ctx, batch)
	defer br.Close()

	var total int
	if err := br.QueryRow().Scan(&total); err != nil {
		return nil, fmt.Errorf("count tasks: %w", err)
	}

	rows, err := br.Query()
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	tasks := []*models.Task{}
	for rows.Next() {
		t := &models.Task{}
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Title, &t.Description, &t.Status, &t.Priority,
			&t.DueDate, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan task: %w", err)
		}
		tasks = append(tasks, t)
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + p.Limit - 1) / p.Limit
	}

	return &models.TaskListResponse{
		Tasks:      tasks,
		Total:      total,
		Page:       p.Page,
		Limit:      p.Limit,
		TotalPages: totalPages,
	}, nil
}

func (r *TaskRepository) FindByID(ctx context.Context, id string) (*models.Task, error) {
	task := &models.Task{}
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		 FROM tasks WHERE id = $1`,
		id,
	).Scan(&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority, &task.DueDate, &task.CreatedAt, &task.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find task by id: %w", err)
	}
	return task, nil
}

// UpdateOwned updates a task only if it is owned by userID (or isAdmin is true).
// Returns ErrNotFound if the task does not exist, ErrForbidden if it exists but is not owned.
func (r *TaskRepository) UpdateOwned(ctx context.Context, id, userID string, isAdmin bool, req *models.UpdateTaskRequest) (*models.Task, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Title != nil {
		sets = append(sets, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.Priority != nil {
		sets = append(sets, fmt.Sprintf("priority = $%d", argIdx))
		args = append(args, *req.Priority)
		argIdx++
	}
	if req.DueDate != nil {
		sets = append(sets, fmt.Sprintf("due_date = $%d", argIdx))
		args = append(args, req.DueDate)
		argIdx++
	}

	if len(sets) == 0 {
		return r.FindByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	// WHERE id=$n AND (user_id=$m OR $k::boolean)
	args = append(args, id, userID, isAdmin)

	query := fmt.Sprintf(
		`UPDATE tasks SET %s WHERE id = $%d AND (user_id = $%d OR $%d::boolean)
		 RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
		strings.Join(sets, ", "), argIdx, argIdx+1, argIdx+2,
	)

	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, args...).
		Scan(&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority, &task.DueDate, &task.CreatedAt, &task.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, r.resolveOwnershipError(ctx, id)
	}
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return task, nil
}

// DeleteOwned deletes a task only if it is owned by userID (or isAdmin is true).
// Returns ErrNotFound if the task does not exist, ErrForbidden if it exists but is not owned.
func (r *TaskRepository) DeleteOwned(ctx context.Context, id, userID string, isAdmin bool) error {
	tag, err := r.db.Exec(ctx,
		`DELETE FROM tasks WHERE id = $1 AND (user_id = $2 OR $3::boolean)`,
		id, userID, isAdmin,
	)
	if err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return r.resolveOwnershipError(ctx, id)
	}
	return nil
}

// resolveOwnershipError checks whether a task exists to distinguish not-found from forbidden.
func (r *TaskRepository) resolveOwnershipError(ctx context.Context, id string) error {
	var exists bool
	r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM tasks WHERE id = $1)`, id).Scan(&exists) //nolint:errcheck
	if exists {
		return ErrForbidden
	}
	return ErrNotFound
}
