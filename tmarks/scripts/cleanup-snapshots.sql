-- 清理孤立的快照记录
-- 在 Cloudflare D1 Dashboard 中执行这些 SQL

-- 1. 查看所有快照记录（按书签分组）
SELECT 
  b.id as bookmark_id,
  b.title as bookmark_title,
  COUNT(s.id) as snapshot_count,
  b.snapshot_count as recorded_count
FROM bookmarks b
LEFT JOIN bookmark_snapshots s ON b.id = s.bookmark_id
WHERE b.has_snapshot = 1
GROUP BY b.id
ORDER BY snapshot_count DESC;

-- 2. 查看特定书签的所有快照
-- SELECT id, version, r2_key, created_at 
-- FROM bookmark_snapshots 
-- WHERE bookmark_id = 'YOUR_BOOKMARK_ID'
-- ORDER BY version DESC;

-- 3. 删除特定快照记录（替换 YOUR_SNAPSHOT_ID）
-- DELETE FROM bookmark_snapshots WHERE id = 'YOUR_SNAPSHOT_ID';

-- 4. 删除某个书签的所有快照记录（替换 YOUR_BOOKMARK_ID）
-- DELETE FROM bookmark_snapshots WHERE bookmark_id = 'YOUR_BOOKMARK_ID';

-- 5. 重新计算并更新所有书签的快照数量
UPDATE bookmarks
SET snapshot_count = (
  SELECT COUNT(*) 
  FROM bookmark_snapshots 
  WHERE bookmark_snapshots.bookmark_id = bookmarks.id
),
has_snapshot = (
  SELECT COUNT(*) > 0
  FROM bookmark_snapshots 
  WHERE bookmark_snapshots.bookmark_id = bookmarks.id
),
latest_snapshot_at = (
  SELECT MAX(created_at)
  FROM bookmark_snapshots
  WHERE bookmark_snapshots.bookmark_id = bookmarks.id
);

-- 6. 验证更新结果
SELECT 
  id,
  title,
  snapshot_count,
  has_snapshot,
  latest_snapshot_at
FROM bookmarks
WHERE snapshot_count > 0
ORDER BY snapshot_count DESC;
