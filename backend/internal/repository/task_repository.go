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
	args := []interface{}{}
	where := []string{}
	argIdx := 1

	if !adminAll {
		where = append(where, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, userID)
		argIdx++
	}

	if p.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, p.Status)
		argIdx++
	}

	if p.Search != "" {
		where = append(where, fmt.Sprintf("title ILIKE $%d", argIdx))
		args = append(args, "%"+p.Search+"%")
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

	// priority is an enum with text values; order semantically high→medium→low
	orderExpr := sortBy
	if sortBy == "priority" {
		orderExpr = "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END"
	}

	var total int
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM tasks %s`, whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("count tasks: %w", err)
	}

	if p.Limit <= 0 {
		p.Limit = 20
	}
	if p.Page <= 0 {
		p.Page = 1
	}
	offset := (p.Page - 1) * p.Limit

	query := fmt.Sprintf(
		`SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		 FROM tasks %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		whereClause, orderExpr, sortDir, argIdx, argIdx+1,
	)
	args = append(args, p.Limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	tasks := []*models.Task{}
	for rows.Next() {
		t := &models.Task{}
		if err := rows.Scan(&t.ID, &t.UserID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.DueDate, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan task: %w", err)
		}
		tasks = append(tasks, t)
	}

	totalPages := (total + p.Limit - 1) / p.Limit

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

func (r *TaskRepository) Update(ctx context.Context, id string, req *models.UpdateTaskRequest) (*models.Task, error) {
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
	args = append(args, id)

	query := fmt.Sprintf(
		`UPDATE tasks SET %s WHERE id = $%d
		 RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
		strings.Join(sets, ", "), argIdx,
	)

	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, args...).
		Scan(&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority, &task.DueDate, &task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return task, nil
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, id)
	return err
}
