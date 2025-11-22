-- ============================================================================
-- 检查缺失的字段
-- 在 Cloudflare D1 Dashboard 中逐个执行这些查询
-- ============================================================================

-- 1. 检查 bookmark_snapshots 表是否存在
SELECT name FROM sqlite_master WHERE type='table' AND name='bookmark_snapshots';
-- 预期：如果返回一行，表示表已存在

-- 2. 检查 bookmarks 表的字段
PRAGMA table_info(bookmarks);
-- 查找以下字段：
-- - has_snapshot
-- - latest_snapshot_at
-- - snapshot_count

-- 3. 检查 user_preferences 表的字段
PRAGMA table_info(user_preferences);
-- 查找以下字段：
-- - snapshot_retention_count
-- - snapshot_auto_create
-- - snapshot_auto_dedupe
-- - snapshot_auto_cleanup_days

-- 4. 检查迁移版本
SELECT * FROM schema_migrations WHERE version='0004';
-- 预期：如果返回一行，表示迁移已记录

-- ============================================================================
-- 根据检查结果，执行相应的 ALTER TABLE 语句
-- ============================================================================
