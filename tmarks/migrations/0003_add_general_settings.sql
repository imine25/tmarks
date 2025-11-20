-- 添加通用设置字段到 user_preferences 表
-- 搜索框自动清空时间（秒）
ALTER TABLE user_preferences ADD COLUMN search_auto_clear_seconds INTEGER NOT NULL DEFAULT 15;

-- 标签选中状态自动清空时间（秒）
ALTER TABLE user_preferences ADD COLUMN tag_selection_auto_clear_seconds INTEGER NOT NULL DEFAULT 30;

-- 是否启用搜索自动清空
ALTER TABLE user_preferences ADD COLUMN enable_search_auto_clear INTEGER NOT NULL DEFAULT 1;

-- 是否启用标签选中自动清空
ALTER TABLE user_preferences ADD COLUMN enable_tag_selection_auto_clear INTEGER NOT NULL DEFAULT 0;

-- 默认书签图标（当书签没有封面图和网站图标时显示）
-- 可选值: 'bookmark', 'star', 'heart', 'link', 'globe', 'folder'
ALTER TABLE user_preferences ADD COLUMN default_bookmark_icon TEXT NOT NULL DEFAULT 'bookmark';

-- 添加网站图标字段到 bookmarks 表
-- favicon: 网站图标URL，当 cover_image 不存在或加载失败时使用
-- 优先级: cover_image > favicon > default_bookmark_icon
ALTER TABLE bookmarks ADD COLUMN favicon TEXT;
