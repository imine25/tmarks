/**
 * 清理孤立快照记录 API
 * 删除 R2 文件不存在的 D1 记录
 * 路径: /api/admin/cleanup-snapshots
 * 认证: 需要管理员权限
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../lib/types'
import { success, internalError, unauthorized, badRequest } from '../../../lib/response'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // 认证检查
    const authHeader = context.request.headers.get('Authorization')
    const adminToken = context.env.ADMIN_TOKEN || 'your-secret-admin-token'
    
    if (authHeader !== `Bearer ${adminToken}`) {
      return unauthorized('Invalid admin token')
    }

    const body = await context.request.json() as { dry_run?: boolean }
    const dryRun = body.dry_run !== false // 默认为 true（只检查不删除）

    const db = context.env.DB
    const bucket = context.env.SNAPSHOTS_BUCKET

    if (!bucket) {
      return internalError('Storage not configured')
    }

    // 获取所有快照记录
    const { results: snapshots } = await db
      .prepare('SELECT id, bookmark_id, user_id, r2_key FROM bookmark_snapshots')
      .all<{ id: string; bookmark_id: string; user_id: string; r2_key: string }>()

    console.log(`[Cleanup] Checking ${snapshots.length} snapshots (dry_run: ${dryRun})...`)

    const toDelete: string[] = []
    const bookmarksToUpdate = new Set<string>()

    // 检查每个快照的 R2 文件是否存在
    for (const snapshot of snapshots) {
      try {
        const r2Object = await bucket.head(snapshot.r2_key)
        if (!r2Object) {
          toDelete.push(snapshot.id)
          bookmarksToUpdate.add(snapshot.bookmark_id)
        }
      } catch (error) {
        // 文件不存在
        toDelete.push(snapshot.id)
        bookmarksToUpdate.add(snapshot.bookmark_id)
      }
    }

    console.log(`[Cleanup] Found ${toDelete.length} orphaned records`)

    if (toDelete.length === 0) {
      return success({
        message: 'No orphaned snapshots found',
        deleted: 0,
        bookmarks_updated: 0,
      })
    }

    if (dryRun) {
      return success({
        message: 'Dry run - no changes made',
        would_delete: toDelete.length,
        would_update_bookmarks: bookmarksToUpdate.size,
        snapshot_ids: toDelete,
      })
    }

    // 实际删除
    const batch = []

    // 删除快照记录
    for (const snapshotId of toDelete) {
      batch.push(
        db.prepare('DELETE FROM bookmark_snapshots WHERE id = ?').bind(snapshotId)
      )
    }

    // 更新书签的快照计数
    for (const bookmarkId of bookmarksToUpdate) {
      batch.push(
        db.prepare(`
          UPDATE bookmarks
          SET snapshot_count = (
            SELECT COUNT(*) FROM bookmark_snapshots WHERE bookmark_id = ?
          ),
          has_snapshot = (
            SELECT COUNT(*) > 0 FROM bookmark_snapshots WHERE bookmark_id = ?
          ),
          latest_snapshot_at = (
            SELECT MAX(created_at) FROM bookmark_snapshots WHERE bookmark_id = ?
          )
          WHERE id = ?
        `).bind(bookmarkId, bookmarkId, bookmarkId, bookmarkId)
      )
    }

    await db.batch(batch)

    console.log(`[Cleanup] Deleted ${toDelete.length} records, updated ${bookmarksToUpdate.size} bookmarks`)

    return success({
      message: 'Cleanup completed',
      deleted: toDelete.length,
      bookmarks_updated: bookmarksToUpdate.size,
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return internalError('Failed to cleanup snapshots')
  }
}
