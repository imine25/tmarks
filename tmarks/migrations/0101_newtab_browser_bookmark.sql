-- ============================================================================
-- NewTab 浏览器书签同步支持
-- 用于存储浏览器书签 ID 与网格组件的映射关系
-- ============================================================================

-- 为 newtab_grid_items 表添加浏览器书签 ID 字段
ALTER TABLE newtab_grid_items ADD COLUMN browser_bookmark_id TEXT;

-- 为 newtab_grid_items 表添加父级 ID 字段（用于文件夹嵌套）
ALTER TABLE newtab_grid_items ADD COLUMN parent_id TEXT;

-- 为 newtab_grid_items 表添加书签文件夹标题字段
ALTER TABLE newtab_grid_items ADD COLUMN bookmark_folder_title TEXT;

-- 创建浏览器书签 ID 索引
CREATE INDEX IF NOT EXISTS idx_newtab_grid_items_browser_bookmark 
ON newtab_grid_items(user_id, browser_bookmark_id);

-- 创建父级 ID 索引（用于查询子项）
CREATE INDEX IF NOT EXISTS idx_newtab_grid_items_parent 
ON newtab_grid_items(user_id, parent_id);

-- 为 newtab_settings 表添加同步状态字段
ALTER TABLE newtab_settings ADD COLUMN browser_folder_recreated_at TEXT;

-- 记录迁移版本
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0101');
