/**
 * 单个快照操作 API
 * 路径: /api/tab/bookmarks/:id/snapshots/:snapshotId
 * 认证: API Key (X-API-Key header)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../../../lib/types'
import { success, notFound, internalError } from '../../../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../../../middleware/api-key-auth-pages'

interface RouteParams {
  id: string
  snapshotId: string
}

// GET /api/tab/bookmarks/:id/snapshots/:snapshotId - 获取快照
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    try {
      const userId = context.data.user_id
      const { id: bookmarkId, snapshotId } = context.params
      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      // 获取快照信息
      const snapshot = await db
        .prepare(
          `SELECT s.*, b.url as bookmark_url
           FROM bookmark_snapshots s
           JOIN bookmarks b ON s.bookmark_id = b.id
           WHERE s.id = ? AND s.bookmark_id = ? AND s.user_id = ?`
        )
        .bind(snapshotId, bookmarkId, userId)
        .first()

      if (!snapshot) {
        return notFound('Snapshot not found')
      }

      // 从 R2 获取快照内容
      const r2Object = await bucket.get(snapshot.r2_key as string)

      if (!r2Object) {
        return notFound('Snapshot file not found')
      }

      // 直接返回 HTML 内容
      const htmlContent = await r2Object.text()

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch (error) {
      console.error('Get snapshot error:', error)
      return internalError('Failed to get snapshot')
    }
  },
]

// DELETE /api/tab/bookmarks/:id/snapshots/:snapshotId - 删除快照
export const onRequestDelete: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const { id: bookmarkId, snapshotId } = context.params

    try {
      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      // 获取快照信息
      const snapshot = await db
        .prepare(
          `SELECT id, r2_key, is_latest
           FROM bookmark_snapshots
           WHERE id = ? AND bookmark_id = ? AND user_id = ?`
        )
        .bind(snapshotId, bookmarkId, userId)
        .first()

      if (!snapshot) {
        return notFound('Snapshot not found')
      }

      // 删除 R2 文件
      await bucket.delete(snapshot.r2_key as string)

      // 删除数据库记录
      await db
        .prepare('DELETE FROM bookmark_snapshots WHERE id = ?')
        .bind(snapshotId)
        .run()

      // 更新书签的快照计数（减1）
      await db
        .prepare(
          `UPDATE bookmarks 
           SET snapshot_count = MAX(0, snapshot_count - 1)
           WHERE id = ?`
        )
        .bind(bookmarkId)
        .run()

      // 如果删除的是最新快照，更新下一个为最新
      if (snapshot.is_latest) {
        const nextLatest = await db
          .prepare(
            `SELECT id FROM bookmark_snapshots
             WHERE bookmark_id = ? AND user_id = ?
             ORDER BY version DESC
             LIMIT 1`
          )
          .bind(bookmarkId, userId)
          .first()

        if (nextLatest) {
          await db
            .prepare(
              `UPDATE bookmark_snapshots 
               SET is_latest = 1 
               WHERE id = ?`
            )
            .bind(nextLatest.id)
            .run()
        } else {
          // 没有快照了，更新书签表
          await db
            .prepare(
              `UPDATE bookmarks 
               SET has_snapshot = 0, 
                   latest_snapshot_at = NULL,
                   snapshot_count = 0
               WHERE id = ?`
            )
            .bind(bookmarkId)
            .run()
        }
      }

      return success({ message: 'Snapshot deleted successfully' })
    } catch (error) {
      console.error('Delete snapshot error:', error)
      return internalError('Failed to delete snapshot')
    }
  },
]
