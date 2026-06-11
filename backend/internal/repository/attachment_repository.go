package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/naveensiwach/task-management/internal/models"
)

type AttachmentRepository struct {
	db *pgxpool.Pool
}

func NewAttachmentRepository(db *pgxpool.Pool) *AttachmentRepository {
	return &AttachmentRepository{db: db}
}

func (r *AttachmentRepository) Create(ctx context.Context, a *models.Attachment) (*models.Attachment, error) {
	err := r.db.QueryRow(ctx,
		`INSERT INTO attachments (task_id, user_id, filename, original_name, mime_type, size)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, task_id, user_id, filename, original_name, mime_type, size, created_at`,
		a.TaskID, a.UserID, a.Filename, a.OriginalName, a.MimeType, a.Size,
	).Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.OriginalName, &a.MimeType, &a.Size, &a.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create attachment: %w", err)
	}
	return a, nil
}

func (r *AttachmentRepository) ListByTask(ctx context.Context, taskID string) ([]*models.Attachment, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, task_id, user_id, filename, original_name, mime_type, size, created_at
		 FROM attachments WHERE task_id = $1 ORDER BY created_at DESC`,
		taskID,
	)
	if err != nil {
		return nil, fmt.Errorf("list attachments: %w", err)
	}
	defer rows.Close()

	var attachments []*models.Attachment
	for rows.Next() {
		a := &models.Attachment{}
		if err := rows.Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.OriginalName, &a.MimeType, &a.Size, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan attachment: %w", err)
		}
		attachments = append(attachments, a)
	}
	return attachments, nil
}

func (r *AttachmentRepository) FindByID(ctx context.Context, id string) (*models.Attachment, error) {
	a := &models.Attachment{}
	err := r.db.QueryRow(ctx,
		`SELECT id, task_id, user_id, filename, original_name, mime_type, size, created_at
		 FROM attachments WHERE id = $1`,
		id,
	).Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.OriginalName, &a.MimeType, &a.Size, &a.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find attachment: %w", err)
	}
	return a, nil
}

func (r *AttachmentRepository) FindByFilename(ctx context.Context, filename string) (*models.Attachment, error) {
	a := &models.Attachment{}
	err := r.db.QueryRow(ctx,
		`SELECT id, task_id, user_id, filename, original_name, mime_type, size, created_at
		 FROM attachments WHERE filename = $1`,
		filename,
	).Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.OriginalName, &a.MimeType, &a.Size, &a.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find attachment by filename: %w", err)
	}
	return a, nil
}

func (r *AttachmentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM attachments WHERE id = $1`, id)
	return err
}
