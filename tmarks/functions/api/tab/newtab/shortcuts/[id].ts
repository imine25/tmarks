/**
 * NewTab 单个快捷方式 API
 * 路径: /api/tab/newtab/shortcuts/:id
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../../lib/types'
import { success, notFound, badRequest, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'
import { sanitizeString } from '../../../../lib/validation'

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

interface UpdateShortcutRequest {
  title?: string
  url?: string
  favicon?: string
  group_id?: string | null
  folder_id?: string | null
  position?: number
}

// GET /api/tab/newtab/shortcuts/:id
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const shortcutId = context.params.id as string

    try {
      const shortcut = await context.env.DB.prepare(
        'SELECT * FROM newtab_shortcuts WHERE id = ? AND user_id = ?'
      )
        .bind(shortcutId, userId)
        .first<ShortcutRow>()

      if (!shortcut) {
        return notFound('Shortcut not found')
      }

      return success({ shortcut })
    } catch (error) {
      console.error('Get shortcut error:', error)
      return internalError('Failed to get shortcut')
    }
  },
]

// PATCH /api/tab/newtab/shortcuts/:id
export const onRequestPatch: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id
    const shortcutId = context.params.id as string

    try {
      // 检查快捷方式是否存在
      const existing = await context.env.DB.prepare(
        'SELECT * FROM newtab_shortcuts WHERE id = ? AND user_id = ?'
      )
        .bind(shortcutId, userId)
        .first<ShortcutRow>()

      if (!existing) {
        return notFound('Shortcut not found')
      }

      const body = (await context.request.json()) as UpdateShortcutRequest
      const updates: string[] = []
      const params: (string | number | null)[] = []

      if (body.title !== undefined) {
        updates.push('title = ?')
        params.push(sanitizeString(body.title, 200))
      }

      if (body.url !== undefined) {
        updates.push('url = ?')
        params.push(sanitizeString(body.url, 2000))
      }

      if (body.favicon !== undefined) {
        updates.push('favicon = ?')
        params.push(body.favicon ? sanitizeString(body.favicon, 2000) : null)
      }

      if (body.group_id !== undefined) {
        updates.push('group_id = ?')
        params.push(body.group_id)
      }

      if (body.folder_id !== undefined) {
        updates.push('folder_id = ?')
        params.push(body.folder_id)
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
      params.push(shortcutId)
      params.push(userId)

      await context.env.DB.prepare(
        `UPDATE newtab_shortcuts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
      )
        .bind(...params)
        .run()

      const shortcut = await context.env.DB.prepare(
        'SELECT * FROM newtab_shortcuts WHERE id = ?'
      )
        .bind(shortcutId)
        .first<ShortcutRow>()

      return success({ shortcut })
    } catch (error) {
      console.error('Update shortcut error:', error)
      return internalError('Failed to update shortcut')
    }
  },
]

// DELETE /api/tab/newtab/shortcuts/:id
export const onRequestDelete: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const shortcutId = context.params.id as string

    try {
      const existing = await context.env.DB.prepare(
        'SELECT id FROM newtab_shortcuts WHERE id = ? AND user_id = ?'
      )
        .bind(shortcutId, userId)
        .first()

      if (!existing) {
        return notFound('Shortcut not found')
      }

      await context.env.DB.prepare(
        'DELETE FROM newtab_shortcuts WHERE id = ? AND user_id = ?'
      )
        .bind(shortcutId, userId)
        .run()

      return success({ message: 'Shortcut deleted' })
    } catch (error) {
      console.error('Delete shortcut error:', error)
      return internalError('Failed to delete shortcut')
    }
  },
]

// POST /api/tab/newtab/shortcuts/:id/click - 记录点击
export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const shortcutId = context.params.id as string

    try {
      const now = new Date().toISOString()

      await context.env.DB.prepare(
        `UPDATE newtab_shortcuts 
         SET click_count = click_count + 1, last_clicked_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
      )
        .bind(now, now, shortcutId, userId)
        .run()

      return success({ message: 'Click recorded' })
    } catch (error) {
      console.error('Record click error:', error)
      return internalError('Failed to record click')
    }
  },
]
