/**
 * NewTab 文件夹 API
 * 路径: /api/tab/newtab/folders
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams, SQLParam } from '../../../../lib/types'
import { success, badRequest, created, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'
import { sanitizeString } from '../../../../lib/validation'
import { generateUUID } from '../../../../lib/crypto'

interface FolderRow {
  id: string
  user_id: string
  group_id: string | null
  name: string
  icon: string | null
  position: number
  created_at: string
  updated_at: string
}

interface CreateFolderRequest {
  name: string
  icon?: string
  group_id?: string
  position?: number
}

// GET /api/tab/newtab/folders - 获取文件夹列表
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const url = new URL(context.request.url)
    const groupId = url.searchParams.get('group_id')

    try {
      let query = 'SELECT * FROM newtab_folders WHERE user_id = ?'
      const params: SQLParam[] = [userId]

      if (groupId) {
        query += ' AND group_id = ?'
        params.push(groupId)
      }

      query += ' ORDER BY position ASC, created_at DESC'

      const { results } = await context.env.DB.prepare(query)
        .bind(...params)
        .all<FolderRow>()

      return success({
        folders: results || [],
        meta: { count: results?.length || 0 },
      })
    } catch (error) {
      console.error('Get folders error:', error)
      return internalError('Failed to get folders')
    }
  },
]

// POST /api/tab/newtab/folders - 创建文件夹
export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as CreateFolderRequest

      if (!body.name) {
        return badRequest('Name is required')
      }

      const name = sanitizeString(body.name, 100)
      const icon = body.icon ? sanitizeString(body.icon, 50) : null
      const groupId = body.group_id || null

      // 获取当前最大 position
      const maxPosResult = await context.env.DB.prepare(
        'SELECT MAX(position) as max_pos FROM newtab_folders WHERE user_id = ?'
      )
        .bind(userId)
        .first<{ max_pos: number | null }>()

      const position = body.position ?? ((maxPosResult?.max_pos ?? -1) + 1)
      const now = new Date().toISOString()
      const id = generateUUID()

      await context.env.DB.prepare(
        `INSERT INTO newtab_folders (id, user_id, group_id, name, icon, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(id, userId, groupId, name, icon, position, now, now)
        .run()

      const folder = await context.env.DB.prepare('SELECT * FROM newtab_folders WHERE id = ?')
        .bind(id)
        .first<FolderRow>()

      return created({ folder })
    } catch (error) {
      console.error('Create folder error:', error)
      return internalError('Failed to create folder')
    }
  },
]
