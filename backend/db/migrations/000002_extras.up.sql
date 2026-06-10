CREATE TABLE attachments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename      VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    size          BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(20) NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_task_id     ON attachments(task_id);
CREATE INDEX idx_activity_logs_task_id   ON activity_logs(task_id);
CREATE INDEX idx_activity_logs_created   ON activity_logs(created_at DESC);
