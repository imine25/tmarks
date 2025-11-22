-- ============================================================================
-- 添加缺失的字段（逐个执行，跳过报错的语句）
-- 在 Cloudflare D1 Dashboard 中执行
-- ============================================================================

-- 步骤 1: 为 bookmarks 表添加 latest_snapshot_at 字段
-- 如果报错 "duplicate column name"，说明字段已存在，跳过即可
ALTER TABLE bookmarks ADD COLUMN latest_snapshot_at TEXT;

-- 步骤 2: 为 bookmarks 表添加 snapshot_count 字段
-- 如果报错 "duplicate column name"，说明字段已存在，跳过即可
ALTER TABLE bookmarks ADD COLUMN snapshot_count INTEGER NOT NULL DEFAULT 0;

-- 步骤 3: 为 user_preferences 表添加 snapshot_retention_count 字段
-- 如果报错 "duplicate column name"，说明字段已存在，跳过即可
ALTER TABLE user_preferences ADD COLUMN snapshot_retention_count INTEGER NOT NULL DEFAULT 5;

-- 步骤 4: 为 user_preferences 表添加 snapshot_auto_create 字段
-- 如果报错 "duplicate column name"，说明字段已存在，跳过即可
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_create INTEGER NOT NULL DEFAULT 0;

-- 步骤 5: 为 user_preferences 表添加 snapshot_auto_dedupe 字段
-- 如果报错 "duplicate column name"，说明字段已存在，跳过即可
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_dedupe INTEGER NOT NULL DEFAULT 1;

-- 步骤 6: 为 user_preferences 表添加 snapshot_auto_cleanup_days 字段
-- 如果报错 "duplicate column name"，说明字段已存在，跳过即可
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_cleanup_days INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- 说明：
-- - 逐个执行上面的语句
-- - 如果某个语句报错 "duplicate column name"，说明该字段已存在，继续执行下一个
-- - 所有语句执行完后，再执行 apply_snapshots_safe.sql 创建表和索引
-- ============================================================================
