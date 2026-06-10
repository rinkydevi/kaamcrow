package models

import "time"

type Status string
type Priority string

const (
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in_progress"
	StatusDone       Status = "done"

	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

type Task struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      Status    `json:"status"`
	Priority    Priority  `json:"priority"`
	DueDate     *time.Time `json:"due_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateTaskRequest struct {
	Title       string     `json:"title" validate:"required,min=1,max=255"`
	Description string     `json:"description"`
	Status      Status     `json:"status" validate:"omitempty,oneof=todo in_progress done"`
	Priority    Priority   `json:"priority" validate:"omitempty,oneof=low medium high"`
	DueDate     *time.Time `json:"due_date"`
}

type UpdateTaskRequest struct {
	Title       *string    `json:"title" validate:"omitempty,min=1,max=255"`
	Description *string    `json:"description"`
	Status      *Status    `json:"status" validate:"omitempty,oneof=todo in_progress done"`
	Priority    *Priority  `json:"priority" validate:"omitempty,oneof=low medium high"`
	DueDate     *time.Time `json:"due_date"`
}

type TaskListParams struct {
	Status  string `json:"status"`
	Search  string `json:"search"`
	SortBy  string `json:"sort_by"`
	SortDir string `json:"sort_dir"`
	Page    int    `json:"page"`
	Limit   int    `json:"limit"`
}

type TaskListResponse struct {
	Tasks      []*Task `json:"tasks"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalPages int     `json:"total_pages"`
}
