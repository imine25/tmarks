
CREATE TABLE IF NOT EXISTS bookmark_snapshots (
  id TEXT PRIMARY KEY,
  bookmark_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  is_latest INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  r2_bucket TEXT NOT NULL DEFAULT 'tmarks-snapshots',
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'text/html',
  snapshot_url TEXT NOT NULL,
  snapshot_title TEXT NOT NULL,
  snapshot_status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_bookmark_id ON bookmark_snapshots(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_user_id ON bookmark_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_created_at ON bookmark_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_content_hash ON bookmark_snapshots(content_hash);
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_bookmark_latest ON bookmark_snapshots(bookmark_id, is_latest DESC);
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_bookmark_version ON bookmark_snapshots(bookmark_id, version DESC);

ALTER TABLE bookmarks ADD COLUMN has_snapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookmarks ADD COLUMN latest_snapshot_at TEXT;
ALTER TABLE bookmarks ADD COLUMN snapshot_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bookmarks_has_snapshot ON bookmarks(user_id, has_snapshot, created_at DESC);

ALTER TABLE user_preferences ADD COLUMN snapshot_retention_count INTEGER NOT NULL DEFAULT 5;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_create INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_dedupe INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_cleanup_days INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0004');

