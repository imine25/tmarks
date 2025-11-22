/**
 * 验证快照完整性 API
 * 检查 D1 记录和 R2 文件是否匹配
 * 路径: /api/admin/verify-snapshots
 * 认证: 需要管理员权限或特殊 token
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../lib/types'
import { success, internalError, unauthorized } from '../../../lib/response'

interface SnapshotVerification {
  snapshot_id: string
  bookmark_id: string
  r2_key: string
  exists_in_r2: boolean
  file_size?: number
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // 简单的认证检查（你可以改进这个）
    const authHeader = context.request.headers.get('Authorization')
    const adminToken = context.env.ADMIN_TOKEN || 'your-secret-admin-token'
    
    if (authHeader !== `Bearer ${adminToken}`) {
      return unauthorized('Invalid admin token')
    }

    const db = context.env.DB
    const bucket = context.env.SNAPSHOTS_BUCKET

    if (!bucket) {
      return internalError('Storage not configured')
    }

    // 获取所有快照记录
    const { results: snapshots } = await db
      .prepare('SELECT id, bookmark_id, r2_key FROM bookmark_snapshots')
      .all<{ id: string; bookmark_id: string; r2_key: string }>()

    console.log(`[Verify] Checking ${snapshots.length} snapshots...`)

    const verifications: SnapshotVerification[] = []
    let missingCount = 0

    // 检查每个快照的 R2 文件是否存在
    for (const snapshot of snapshots) {
      try {
        const r2Object = await bucket.head(snapshot.r2_key)
        
        verifications.push({
          snapshot_id: snapshot.id,
          bookmark_id: snapshot.bookmark_id,
          r2_key: snapshot.r2_key,
          exists_in_r2: !!r2Object,
          file_size: r2Object?.size,
        })
      } catch (error) {
        // 文件不存在
        verifications.push({
          snapshot_id: snapshot.id,
          bookmark_id: snapshot.bookmark_id,
          r2_key: snapshot.r2_key,
          exists_in_r2: false,
        })
        missingCount++
      }
    }

    // 按书签分组
    const byBookmark = new Map<string, SnapshotVerification[]>()
    for (const v of verifications) {
      if (!byBookmark.has(v.bookmark_id)) {
        byBookmark.set(v.bookmark_id, [])
      }
      byBookmark.get(v.bookmark_id)!.push(v)
    }

    const summary = {
      total_snapshots: snapshots.length,
      missing_files: missingCount,
      bookmarks_affected: Array.from(byBookmark.entries())
        .filter(([_, snaps]) => snaps.some(s => !s.exists_in_r2))
        .length,
    }

    return success({
      summary,
      verifications: verifications.filter(v => !v.exists_in_r2), // 只返回缺失的
      all_verifications: verifications, // 完整列表
    })
  } catch (error) {
    console.error('[Verify] Error:', error)
    return internalError('Failed to verify snapshots')
  }
}
