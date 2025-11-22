/**
 * 快照图片代理 API
 * 路径: /api/snapshot-images/:hash
 * 用于从 R2 读取快照中的图片
 * 
 * 注意: 此 API 通过验证书签所有权来确保安全性
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../lib/types'
import { notFound, internalError, forbidden } from '../../../lib/response'

// GET /api/snapshot-images/:hash - 获取快照图片
export const onRequestGet: PagesFunction<Env, 'hash'> = async (context) => {
  try {
    const hash = context.params.hash as string
    const bucket = context.env.SNAPSHOTS_BUCKET
    const db = context.env.DB

    if (!bucket || !db) {
      return internalError('Storage not configured')
    }

    // 从 URL 参数获取快照信息
    const url = new URL(context.request.url)
    const userId = url.searchParams.get('u')
    const bookmarkId = url.searchParams.get('b')
    const version = url.searchParams.get('v')

    if (!userId || !bookmarkId || !version) {
      return notFound('Missing required parameters')
    }

    // 验证书签和快照的存在性及所有权
    // 这确保了用户只能访问自己的快照图片
    const snapshot = await db
      .prepare(
        `SELECT s.id 
         FROM bookmark_snapshots s
         JOIN bookmarks b ON s.bookmark_id = b.id
         WHERE s.bookmark_id = ? 
           AND s.user_id = ? 
           AND s.version = ?
           AND b.deleted_at IS NULL`
      )
      .bind(bookmarkId, userId, parseInt(version))
      .first()

    if (!snapshot) {
      console.warn(`[Snapshot Image API] Unauthorized access attempt: u=${userId}, b=${bookmarkId}, v=${version}`)
      return forbidden('Access denied')
    }

    // 构建 R2 键
    const imageKey = `${userId}/${bookmarkId}/v${version}/images/${hash}`

    console.log(`[Snapshot Image API] Fetching: ${imageKey}`)

    // 从 R2 获取图片
    const r2Object = await bucket.get(imageKey)

    if (!r2Object) {
      console.warn(`[Snapshot Image API] Image not found: ${imageKey}`)
      return notFound('Image not found')
    }

    // 返回图片
    const imageData = await r2Object.arrayBuffer()
    const contentType = r2Object.httpMetadata?.contentType || 'image/jpeg'

    console.log(`[Snapshot Image API] Serving: ${imageKey}, ${(imageData.byteLength / 1024).toFixed(1)}KB`)

    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 图片永久缓存
        'Access-Control-Allow-Origin': '*', // 允许跨域（因为可能从不同域名访问快照）
      },
    })
  } catch (error) {
    console.error('[Snapshot Image API] Error:', error)
    return internalError('Failed to get image')
  }
}
