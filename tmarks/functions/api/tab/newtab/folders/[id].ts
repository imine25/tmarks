/**
 * NewTab 单个文件夹 API
 * 路径: /api/tab/newtab/folders/:id
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../../lib/types'
import { success, notFound, badRequest, internalError } from '../../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../../middleware/api-key-auth-pages'
import { sanitizeString } from '../../../../lib/validation'

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

interface UpdateFolderRequest {
  name?: string
  icon?: string | null
  group_id?: string | null
  position?: number
}

// GET /api/tab/newtab/folders/:id
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id
    const folderId = context.params.id as string

    try {
      const folder = await context.env.DB.prepare(
        'SELECT * FROM newtab_folders WHERE id = ? AND user_id = ?'
      )
        .bind(folderId, userId)
        .first<FolderRow>()

      if (!folder) {
        return notFound('Folder not found')
      }

      return success({ folder })
    } catch (error) {
      console.error('Get folder error:', error)
      return internalError('Failed to get folder')
    }
  },
]

// PATCH /api/tab/newtab/folders/:id
export const onRequestPatch: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id
    const folderId = context.params.id as string

    try {
      const existing = await context.env.DB.prepare(
        'SELECT * FROM newtab_folders WHERE id = ? AND user_id = ?'
      )
        .bind(folderId, userId)
        .first<FolderRow>()

      if (!existing) {
        return notFound('Folder not found')
      }

      const body = (await context.request.json()) as UpdateFolderRequest
      const updates: string[] = []
      const params: (string | number | null)[] = []

      if (body.name !== undefined) {
        updates.push('name = ?')
        params.push(sanitizeString(body.name, 100))
      }

      if (body.icon !== undefined) {
        updates.push('icon = ?')
        params.push(body.icon ? sanitizeString(body.icon, 50) : null)
      }

      if (body.group_id !== undefined) {
        updates.push('group_id = ?')
        params.push(body.group_id)
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
      params.push(folderId)
      params.push(userId)

      await context.env.DB.prepare(
        `UPDATE newtab_folders SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
      )
        .bind(...params)
        .run()

      const folder = await context.env.DB.prepare('SELECT * FROM newtab_folders WHERE id = ?')
        .bind(folderId)
        .first<FolderRow>()

      return success({ folder })
    } catch (error) {
      console.error('Update folder error:', error)
      return internalError('Failed to update folder')
    }
  },
]

// DELETE /api/tab/newtab/folders/:id
export const onRequestDelete: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.delete'),
  async (context) => {
    const userId = context.data.user_id
    const folderId = context.params.id as string

    try {
      const existing = await context.env.DB.prepare(
        'SELECT id FROM newtab_folders WHERE id = ? AND user_id = ?'
      )
        .bind(folderId, userId)
        .first()

      if (!existing) {
        return notFound('Folder not found')
      }

      // 将文件夹内的快捷方式移出（设置 folder_id 为 null）
      await context.env.DB.prepare(
        'UPDATE newtab_shortcuts SET folder_id = NULL, updated_at = ? WHERE folder_id = ? AND user_id = ?'
      )
        .bind(new Date().toISOString(), folderId, userId)
        .run()

      // 删除文件夹
      await context.env.DB.prepare(
        'DELETE FROM newtab_folders WHERE id = ? AND user_id = ?'
      )
        .bind(folderId, userId)
        .run()

      return success({ message: 'Folder deleted' })
    } catch (error) {
      console.error('Delete folder error:', error)
      return internalError('Failed to delete folder')
    }
  },
]
