package models

import (
	"encoding/json"
	"time"
)

type ActivityAction string

const (
	ActionCreated ActivityAction = "created"
	ActionUpdated ActivityAction = "updated"
	ActionDeleted ActivityAction = "deleted"
)

type ActivityLog struct {
	ID        string          `json:"id"`
	TaskID    string          `json:"task_id"`
	UserID    string          `json:"user_id"`
	Action    ActivityAction  `json:"action"`
	OldValues json.RawMessage `json:"old_values,omitempty"`
	NewValues json.RawMessage `json:"new_values,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}
