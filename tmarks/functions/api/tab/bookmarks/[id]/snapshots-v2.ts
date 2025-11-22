/**
 * 书签快照 API V2 - 图片单独存储版本
 * 路径: /api/tab/bookmarks/:id/snapshots-v2
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env } from '../../../../lib/types'
import { success, badRequest, notFound, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'

function generateNanoId(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const length = 21
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  let id = ''
  for (let i = 0; i < length; i++) {
    id += alphabet[randomValues[i] % alphabet.length]
  }
  return id
}

async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface CreateSnapshotV2Request {
  html_content: string
  title: string
  url: string
  images: Array<{
    hash: string
    data: string // base64 encoded
    type: string // mime type
  }>
  force?: boolean
}

const MAX_SNAPSHOT_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB per image

// POST /api/tab/bookmarks/:id/snapshots-v2 - 创建快照（V2版本）
export const onRequestPost: PagesFunction<Env, 'id', ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id
    const bookmarkId = context.params.id as string

    try {
      const body = await context.request.json() as CreateSnapshotV2Request
      const { html_content, title, url, images = [], force = false } = body

      if (!html_content || !title || !url) {
        return badRequest('Missing required fields')
      }

      console.log(`[Snapshot V2 API] Received: HTML ${(html_content.length / 1024).toFixed(1)}KB, ${images.length} images`)

      const db = context.env.DB
      const bucket = context.env.SNAPSHOTS_BUCKET

      if (!bucket) {
        return internalError('Storage not configured')
      }

      // 验证书签所有权
      const bookmark = await db
        .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
        .bind(bookmarkId, userId)
        .first()

      if (!bookmark) {
        return notFound('Bookmark not found')
      }

      // 计算内容哈希
      const contentHash = await sha256(html_content)

      // 检查是否重复
      if (!force) {
        const latestSnapshot = await db
          .prepare(
            `SELECT content_hash FROM bookmark_snapshots
             WHERE bookmark_id = ? AND is_latest = 1`
          )
          .bind(bookmarkId)
          .first()

        if (latestSnapshot && latestSnapshot.content_hash === contentHash) {
          return success({
            message: 'Content unchanged, no new snapshot created',
            is_duplicate: true,
          })
        }
      }

      // 获取版本号
      const versionResult = await db
        .prepare(
          `SELECT COALESCE(MAX(version), 0) + 1 as next_version
           FROM bookmark_snapshots
           WHERE bookmark_id = ?`
        )
        .bind(bookmarkId)
        .first()

      const version = versionResult?.next_version as number || 1
      const timestamp = Date.now()

      // 1. 上传图片到 R2
      const uploadedImages: string[] = []
      let totalImageSize = 0

      for (const image of images) {
        try {
          // 解码 base64
          const base64Data = image.data.split(',')[1] || image.data
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          const imageSize = bytes.length
          totalImageSize += imageSize

          if (imageSize > MAX_IMAGE_SIZE) {
            console.warn(`[Snapshot V2 API] Image too large: ${image.hash}, ${(imageSize / 1024).toFixed(1)}KB`)
            continue
          }

          // 上传到 R2: {userId}/{bookmarkId}/v{version}/images/{hash}
          const imageKey = `${userId}/${bookmarkId}/v${version}/images/${image.hash}`
          
          await bucket.put(imageKey, bytes, {
            httpMetadata: {
              contentType: image.type,
            },
            customMetadata: {
              userId,
              bookmarkId,
              version: version.toString(),
              snapshotTimestamp: timestamp.toString(),
            },
          })

          uploadedImages.push(image.hash)
          console.log(`[Snapshot V2 API] Image uploaded: ${image.hash}, ${(imageSize / 1024).toFixed(1)}KB`)
        } catch (error) {
          console.error(`[Snapshot V2 API] Failed to upload image ${image.hash}:`, error)
        }
      }

      console.log(`[Snapshot V2 API] Uploaded ${uploadedImages.length}/${images.length} images, total: ${(totalImageSize / 1024).toFixed(1)}KB`)

      // 2. 上传 HTML 到 R2
      const htmlKey = `${userId}/${bookmarkId}/snapshot-${timestamp}-v${version}.html`
      const encoder = new TextEncoder()
      const htmlBytes = encoder.encode(html_content)

      await bucket.put(htmlKey, htmlBytes, {
        httpMetadata: {
          contentType: 'text/html; charset=utf-8',
        },
        customMetadata: {
          userId,
          bookmarkId,
          version: version.toString(),
          title,
          imageCount: uploadedImages.length.toString(),
          snapshotVersion: '2',
        },
      })

      console.log(`[Snapshot V2 API] HTML uploaded: ${htmlKey}, ${(htmlBytes.length / 1024).toFixed(1)}KB`)

      // 3. 保存到数据库
      const snapshotId = generateNanoId()
      const now = new Date().toISOString()
      const totalSize = htmlBytes.length + totalImageSize

      const batch = [
        db.prepare(
          `INSERT INTO bookmark_snapshots 
           (id, bookmark_id, user_id, version, is_latest, content_hash, 
            r2_key, r2_bucket, file_size, mime_type, snapshot_url, 
            snapshot_title, snapshot_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, 'tmarks-snapshots', ?, 'text/html', ?, ?, 'completed', ?, ?)`
        ).bind(
          snapshotId,
          bookmarkId,
          userId,
          version,
          contentHash,
          htmlKey,
          totalSize,
          url,
          title,
          now,
          now
        ),

        db.prepare(
          `UPDATE bookmark_snapshots 
           SET is_latest = 0 
           WHERE bookmark_id = ? AND id != ?`
        ).bind(bookmarkId, snapshotId),

        db.prepare(
          `UPDATE bookmarks 
           SET has_snapshot = 1, 
               latest_snapshot_at = ?,
               snapshot_count = snapshot_count + 1
           WHERE id = ?`
        ).bind(now, bookmarkId),
      ]

      await db.batch(batch)

      return success({
        snapshot: {
          id: snapshotId,
          version,
          file_size: totalSize,
          image_count: uploadedImages.length,
          content_hash: contentHash,
          created_at: now,
        },
        message: 'Snapshot created successfully (V2)',
      })
    } catch (error) {
      console.error('[Snapshot V2 API] Error:', error)
      return internalError('Failed to create snapshot')
    }
  },
]
