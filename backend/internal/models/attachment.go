package models

import "time"

type Attachment struct {
	ID           string    `json:"id"`
	TaskID       string    `json:"task_id"`
	UserID       string    `json:"user_id"`
	Filename     string    `json:"filename"`
	OriginalName string    `json:"original_name"`
	MimeType     string    `json:"mime_type"`
	Size         int64     `json:"size"`
	CreatedAt    time.Time `json:"created_at"`
}
