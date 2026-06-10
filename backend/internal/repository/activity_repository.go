package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/naveensiwach/task-management/internal/models"
)

type ActivityRepository struct {
	db *pgxpool.Pool
}

func NewActivityRepository(db *pgxpool.Pool) *ActivityRepository {
	return &ActivityRepository{db: db}
}

func (r *ActivityRepository) Log(ctx context.Context, taskID, userID string, action models.ActivityAction, oldVals, newVals interface{}) error {
	var oldJSON, newJSON []byte
	var err error

	if oldVals != nil {
		if oldJSON, err = json.Marshal(oldVals); err != nil {
			return fmt.Errorf("marshal old values: %w", err)
		}
	}
	if newVals != nil {
		if newJSON, err = json.Marshal(newVals); err != nil {
			return fmt.Errorf("marshal new values: %w", err)
		}
	}

	_, err = r.db.Exec(ctx,
		`INSERT INTO activity_logs (task_id, user_id, action, old_values, new_values)
		 VALUES ($1, $2, $3, $4, $5)`,
		taskID, userID, string(action), oldJSON, newJSON,
	)
	return err
}

func (r *ActivityRepository) ListByTask(ctx context.Context, taskID string) ([]*models.ActivityLog, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, task_id, user_id, action, old_values, new_values, created_at
		 FROM activity_logs WHERE task_id = $1 ORDER BY created_at DESC LIMIT 50`,
		taskID,
	)
	if err != nil {
		return nil, fmt.Errorf("list activity: %w", err)
	}
	defer rows.Close()

	var logs []*models.ActivityLog
	for rows.Next() {
		l := &models.ActivityLog{}
		if err := rows.Scan(&l.ID, &l.TaskID, &l.UserID, &l.Action, &l.OldValues, &l.NewValues, &l.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan activity: %w", err)
		}
		logs = append(logs, l)
	}
	return logs, nil
}
