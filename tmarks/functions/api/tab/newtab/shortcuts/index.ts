/**
 * NewTab 快捷方式 API
 * 路径: /api/tab/newtab/shortcuts
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams, SQLParam } from '../../../../lib/types'
import { success, badRequest, created, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'
import { isValidUrl, sanitizeString } from '../../../../lib/validation'
import { generateUUID } from '../../../../lib/crypto'

interface ShortcutRow {
  id: string
  user_id: string
  group_id: string | null
  folder_id: string | null
  title: string
  url: string
  favicon: string | null
  position: number
  click_count: number
  last_clicked_at: string | null
  bookmark_id: string | null
  created_at: string
  updated_at: string
}

interface CreateShortcutRequest {
  title: string
  url: string
  favicon?: string
  group_id?: string
  folder_id?: string
  position?: number
  bookmark_id?: string
}

// GET /api/tab/newtab/shortcuts - 获取快捷方式列表
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const url = new URL(context.request.url)
    const groupId = url.searchParams.get('group_id')

    try {
      let query = `
        SELECT * FROM newtab_shortcuts
        WHERE user_id = ?
      `
      const params: SQLParam[] = [userId]

      if (groupId) {
        query += ` AND group_id = ?`
        params.push(groupId)
      }

      query += ` ORDER BY position ASC, created_at DESC`

      const { results } = await context.env.DB.prepare(query)
        .bind(...params)
        .all<ShortcutRow>()

      return success({
        shortcuts: results || [],
        meta: {
          count: results?.length || 0,
        },
      })
    } catch (error) {
      console.error('Get shortcuts error:', error)
      return internalError('Failed to get shortcuts')
    }
  },
]

// POST /api/tab/newtab/shortcuts - 创建快捷方式
export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as CreateShortcutRequest

      if (!body.title || !body.url) {
        return badRequest('Title and URL are required')
      }

      if (!isValidUrl(body.url)) {
        return badRequest('Invalid URL format')
      }

      const title = sanitizeString(body.title, 200)
      const url = sanitizeString(body.url, 2000)
      const favicon = body.favicon ? sanitizeString(body.favicon, 2000) : null
      const groupId = body.group_id || null
      const folderId = body.folder_id || null
      const bookmarkId = body.bookmark_id || null

      // 获取当前最大 position
      const maxPosResult = await context.env.DB.prepare(
        'SELECT MAX(position) as max_pos FROM newtab_shortcuts WHERE user_id = ?'
      )
        .bind(userId)
        .first<{ max_pos: number | null }>()

      const position = body.position ?? ((maxPosResult?.max_pos ?? -1) + 1)
      const now = new Date().toISOString()
      const id = generateUUID()

      await context.env.DB.prepare(
        `INSERT INTO newtab_shortcuts (id, user_id, group_id, folder_id, title, url, favicon, position, bookmark_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(id, userId, groupId, folderId, title, url, favicon, position, bookmarkId, now, now)
        .run()

      const shortcut = await context.env.DB.prepare(
        'SELECT * FROM newtab_shortcuts WHERE id = ?'
      )
        .bind(id)
        .first<ShortcutRow>()

      return created({ shortcut })
    } catch (error) {
      console.error('Create shortcut error:', error)
      return internalError('Failed to create shortcut')
    }
  },
]

// PUT /api/tab/newtab/shortcuts - 批量更新（用于同步）
export const onRequestPut: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as {
        shortcuts: Array<{
          id?: string
          title: string
          url: string
          favicon?: string
          group_id?: string
          folder_id?: string
          position: number
        }>
      }

      if (!body.shortcuts || !Array.isArray(body.shortcuts)) {
        return badRequest('shortcuts array is required')
      }

      const now = new Date().toISOString()
      const results: ShortcutRow[] = []

      // 删除现有快捷方式
      await context.env.DB.prepare('DELETE FROM newtab_shortcuts WHERE user_id = ?')
        .bind(userId)
        .run()

      // 批量插入新快捷方式
      for (const item of body.shortcuts) {
        const id = item.id || generateUUID()
        const title = sanitizeString(item.title, 200)
        const url = sanitizeString(item.url, 2000)
        const favicon = item.favicon ? sanitizeString(item.favicon, 2000) : null
        const groupId = item.group_id || null
        const folderId = item.folder_id || null

        await context.env.DB.prepare(
          `INSERT INTO newtab_shortcuts (id, user_id, group_id, folder_id, title, url, favicon, position, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, userId, groupId, folderId, title, url, favicon, item.position, now, now)
          .run()

        results.push({
          id,
          user_id: userId,
          group_id: groupId,
          folder_id: folderId,
          title,
          url,
          favicon,
          position: item.position,
          click_count: 0,
          last_clicked_at: null,
          bookmark_id: null,
          created_at: now,
          updated_at: now,
        })
      }

      return success({
        shortcuts: results,
        meta: { count: results.length },
      })
    } catch (error) {
      console.error('Sync shortcuts error:', error)
      return internalError('Failed to sync shortcuts')
    }
  },
]
