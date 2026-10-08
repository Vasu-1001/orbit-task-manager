-- Migration: 002_add_reminder_sent_at.sql
-- Description: Track deadline reminder delivery timestamp for email deduplication

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_sent_at ON tasks(reminder_sent_at);
