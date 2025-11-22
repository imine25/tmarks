-- ============================================================================
-- 网页快照功能
-- 版本: 0004
-- 说明: 添加网页快照存储和管理功能
-- ============================================================================

-- 快照表：存储网页快照的元数据
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

-- 索引：按书签 ID 查询快照
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_bookmark_id ON bookmark_snapshots(bookmark_id);

-- 索引：按用户 ID 查询快照
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_user_id ON bookmark_snapshots(user_id);

-- 索引：按创建时间排序
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_created_at ON bookmark_snapshots(created_at DESC);

-- 索引：按内容哈希查询（用于去重）
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_content_hash ON bookmark_snapshots(content_hash);

-- 索引：查询最新快照
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_bookmark_latest ON bookmark_snapshots(bookmark_id, is_latest DESC);

-- 索引：按版本号排序
CREATE INDEX IF NOT EXISTS idx_bookmark_snapshots_bookmark_version ON bookmark_snapshots(bookmark_id, version DESC);

-- 书签表：添加快照相关字段
ALTER TABLE bookmarks ADD COLUMN has_snapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookmarks ADD COLUMN latest_snapshot_at TEXT;
ALTER TABLE bookmarks ADD COLUMN snapshot_count INTEGER NOT NULL DEFAULT 0;

-- 索引：按快照状态筛选书签
CREATE INDEX IF NOT EXISTS idx_bookmarks_has_snapshot ON bookmarks(user_id, has_snapshot, created_at DESC);

-- 用户偏好设置：添加快照相关配置
ALTER TABLE user_preferences ADD COLUMN snapshot_retention_count INTEGER NOT NULL DEFAULT 5;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_create INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_dedupe INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_cleanup_days INTEGER NOT NULL DEFAULT 0;

-- 记录迁移版本
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0004');

-- ============================================================================
-- 说明
-- ============================================================================
-- 
-- bookmark_snapshots 表字段说明：
-- - id: 快照唯一标识符 (nanoid)
-- - bookmark_id: 关联的书签 ID
-- - user_id: 用户 ID
-- - version: 快照版本号（同一书签的快照按创建顺序递增）
-- - is_latest: 是否为最新版本（0 或 1）
-- - content_hash: 内容 SHA-256 哈希（用于去重）
-- - r2_key: R2 存储键 (userId/bookmarkId/snapshot-timestamp-vN.html)
-- - r2_bucket: R2 存储桶名称
-- - file_size: HTML 文件大小（字节）
-- - mime_type: MIME 类型（默认 text/html）
-- - snapshot_url: 快照时的原始 URL
-- - snapshot_title: 快照标题（通常是网页标题）
-- - snapshot_status: 快照状态（completed, failed, processing）
-- - created_at: 创建时间
-- - updated_at: 更新时间
--
-- bookmarks 表新增字段说明：
-- - has_snapshot: 是否有快照（0 或 1）
-- - latest_snapshot_at: 最新快照创建时间
-- - snapshot_count: 快照总数
--
-- user_preferences 表新增字段说明：
-- - snapshot_retention_count: 每个书签保留的快照数量（默认 5，-1 表示无限制）
-- - snapshot_auto_create: 是否自动创建快照（0 或 1，默认 0）
-- - snapshot_auto_dedupe: 是否自动去重（0 或 1，默认 1）
-- - snapshot_auto_cleanup_days: 自动清理天数（0 表示不限制）
--
-- ============================================================================
