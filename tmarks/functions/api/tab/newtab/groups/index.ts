/**
 * NewTab 分组 API
 * 路径: /api/tab/newtab/groups
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams, SQLParam } from '../../../../lib/types'
import { success, badRequest, created, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'
import { sanitizeString } from '../../../../lib/validation'
import { generateUUID } from '../../../../lib/crypto'

interface GroupRow {
  id: string
  user_id: string
  name: string
  icon: string
  position: number
  created_at: string
  updated_at: string
}

interface CreateGroupRequest {
  name: string
  icon?: string
  position?: number
}

// GET /api/tab/newtab/groups - 获取分组列表
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const { results } = await context.env.DB.prepare(
        `SELECT * FROM newtab_groups WHERE user_id = ? ORDER BY position ASC`
      )
        .bind(userId)
        .all<GroupRow>()

      return success({
        groups: results || [],
        meta: { count: results?.length || 0 },
      })
    } catch (error) {
      console.error('Get groups error:', error)
      return internalError('Failed to get groups')
    }
  },
]

// POST /api/tab/newtab/groups - 创建分组
export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as CreateGroupRequest

      if (!body.name) {
        return badRequest('Name is required')
      }

      const name = sanitizeString(body.name, 50)
      const icon = body.icon ? sanitizeString(body.icon, 50) : 'Folder'

      // 获取当前最大 position
      const maxPosResult = await context.env.DB.prepare(
        'SELECT MAX(position) as max_pos FROM newtab_groups WHERE user_id = ?'
      )
        .bind(userId)
        .first<{ max_pos: number | null }>()

      const position = body.position ?? ((maxPosResult?.max_pos ?? -1) + 1)
      const now = new Date().toISOString()
      const id = generateUUID()

      await context.env.DB.prepare(
        `INSERT INTO newtab_groups (id, user_id, name, icon, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(id, userId, name, icon, position, now, now)
        .run()

      const group = await context.env.DB.prepare('SELECT * FROM newtab_groups WHERE id = ?')
        .bind(id)
        .first<GroupRow>()

      return created({ group })
    } catch (error) {
      console.error('Create group error:', error)
      return internalError('Failed to create group')
    }
  },
]

// PUT /api/tab/newtab/groups - 批量更新（用于同步）
export const onRequestPut: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as {
        groups: Array<{
          id?: string
          name: string
          icon: string
          position: number
        }>
      }

      if (!body.groups || !Array.isArray(body.groups)) {
        return badRequest('groups array is required')
      }

      const now = new Date().toISOString()
      const results: GroupRow[] = []

      // 删除现有分组
      await context.env.DB.prepare('DELETE FROM newtab_groups WHERE user_id = ?')
        .bind(userId)
        .run()

      // 批量插入新分组
      for (const item of body.groups) {
        const id = item.id || generateUUID()
        const name = sanitizeString(item.name, 50)
        const icon = sanitizeString(item.icon, 50)

        await context.env.DB.prepare(
          `INSERT INTO newtab_groups (id, user_id, name, icon, position, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, userId, name, icon, item.position, now, now)
          .run()

        results.push({
          id,
          user_id: userId,
          name,
          icon,
          position: item.position,
          created_at: now,
          updated_at: now,
        })
      }

      return success({
        groups: results,
        meta: { count: results.length },
      })
    } catch (error) {
      console.error('Sync groups error:', error)
      return internalError('Failed to sync groups')
    }
  },
]
