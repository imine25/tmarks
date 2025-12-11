/**
 * NewTab 单个分组 API
 * 路径: /api/tab/newtab/groups/:id
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../../lib/types'
import { success, notFound, badRequest, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'
import { sanitizeString } from '../../../../lib/validation'

interface GroupRow {
  id: string
  user_id: string
  name: string
  icon: string
  position: number
  created_at: string
  updated_at: string
}

interface UpdateGroupRequest {
  name?: string
  icon?: string
  position?: number
}

// GET /api/tab/newtab/groups/:id
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const groupId = context.params.id as string

    try {
      const group = await context.env.DB.prepare(
        'SELECT * FROM newtab_groups WHERE id = ? AND user_id = ?'
      )
        .bind(groupId, userId)
        .first<GroupRow>()

      if (!group) {
        return notFound('Group not found')
      }

      return success({ group })
    } catch (error) {
      console.error('Get group error:', error)
      return internalError('Failed to get group')
    }
  },
]

// PATCH /api/tab/newtab/groups/:id
export const onRequestPatch: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id
    const groupId = context.params.id as string

    try {
      const existing = await context.env.DB.prepare(
        'SELECT * FROM newtab_groups WHERE id = ? AND user_id = ?'
      )
        .bind(groupId, userId)
        .first<GroupRow>()

      if (!existing) {
        return notFound('Group not found')
      }

      const body = (await context.request.json()) as UpdateGroupRequest
      const updates: string[] = []
      const params: (string | number)[] = []

      if (body.name !== undefined) {
        updates.push('name = ?')
        params.push(sanitizeString(body.name, 50))
      }

      if (body.icon !== undefined) {
        updates.push('icon = ?')
        params.push(sanitizeString(body.icon, 50))
      }

      if (body.position !== undefined) {
        updates.push('position = ?')
        params.push(body.position)
      }

      if (updates.length === 0) {
        return badRequest('No fields to update')
      }

      updates.push('updated_at = ?')
      params.push(new Date().toISOString())
      params.push(groupId)
      params.push(userId)

      await context.env.DB.prepare(
        `UPDATE newtab_groups SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
      )
        .bind(...params)
        .run()

      const group = await context.env.DB.prepare('SELECT * FROM newtab_groups WHERE id = ?')
        .bind(groupId)
        .first<GroupRow>()

      return success({ group })
    } catch (error) {
      console.error('Update group error:', error)
      return internalError('Failed to update group')
    }
  },
]

// DELETE /api/tab/newtab/groups/:id
export const onRequestDelete: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const groupId = context.params.id as string

    try {
      const existing = await context.env.DB.prepare(
        'SELECT id FROM newtab_groups WHERE id = ? AND user_id = ?'
      )
        .bind(groupId, userId)
        .first()

      if (!existing) {
        return notFound('Group not found')
      }

      // 删除分组（快捷方式的 group_id 会被设为 NULL）
      await context.env.DB.prepare('DELETE FROM newtab_groups WHERE id = ? AND user_id = ?')
        .bind(groupId, userId)
        .run()

      return success({ message: 'Group deleted' })
    } catch (error) {
      console.error('Delete group error:', error)
      return internalError('Failed to delete group')
    }
  },
]
