-- Composite indexes for the two most common query shapes:
-- default list (user + sort by created_at)
-- filtered list (user + status filter + sort by created_at)
CREATE INDEX IF NOT EXISTS idx_tasks_user_created       ON tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_created ON tasks(user_id, status, created_at DESC);
