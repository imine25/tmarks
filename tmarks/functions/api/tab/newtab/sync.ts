/**
 * NewTab 数据同步 API
 * 路径: /api/tab/newtab/sync
 * 用于一次性获取或同步所有 NewTab 数据
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../../lib/types'
import { success, badRequest, internalError } from '../../../lib/response'
import { requireApiKeyAuth, ApiKeyAuthContext } from '../../../middleware/api-key-auth-pages'
import { sanitizeString } from '../../../lib/validation'
import { generateUUID } from '../../../lib/crypto'

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

interface GroupRow {
  id: string
  user_id: string
  name: string
  icon: string
  position: number
  created_at: string
  updated_at: string
}

interface SettingsRow {
  user_id: string
  columns: number
  style: string
  show_title: number
  background_type: string
  background_value: string | null
  background_blur: number
  background_dim: number
  show_search: number
  show_clock: number
  show_weather: number
  show_todo: number
  show_hot_search: number
  show_pinned_bookmarks: number
  search_engine: string
  use_widget_grid: number
  updated_at: string
}

interface GridItemRow {
  id: string
  user_id: string
  group_id: string | null
  type: string
  size: string
  position: number
  shortcut_url: string | null
  shortcut_title: string | null
  shortcut_favicon: string | null
  config: string | null
  created_at: string
  updated_at: string
}

interface SyncRequest {
  shortcuts?: Array<{
    id?: string
    title: string
    url: string
    favicon?: string
    group_id?: string
    folder_id?: string
    position: number
  }>
  groups?: Array<{
    id?: string
    name: string
    icon: string
    position: number
  }>
  folders?: Array<{
    id?: string
    name: string
    icon?: string
    group_id?: string
    position: number
  }>
  settings?: {
    columns?: number
    style?: string
    showTitle?: boolean
    backgroundType?: string
    backgroundValue?: string
    backgroundBlur?: number
    backgroundDim?: number
    showSearch?: boolean
    showClock?: boolean
    showWeather?: boolean
    showTodo?: boolean
    showHotSearch?: boolean
    showPinnedBookmarks?: boolean
    searchEngine?: string
    useWidgetGrid?: boolean
  }
  gridItems?: Array<{
    id?: string
    type: string
    size: string
    position: number
    group_id?: string
    shortcut?: {
      url: string
      title: string
      favicon?: string
    }
    config?: Record<string, unknown>
  }>
}

// GET /api/tab/newtab/sync - 获取所有 NewTab 数据
export const onRequestGet: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.read'),
  async (context) => {
    const userId = context.data.user_id

    try {
      // 获取快捷方式
      const { results: shortcuts } = await context.env.DB.prepare(
        'SELECT * FROM newtab_shortcuts WHERE user_id = ? ORDER BY position ASC'
      )
        .bind(userId)
        .all<ShortcutRow>()

      // 获取分组
      const { results: groups } = await context.env.DB.prepare(
        'SELECT * FROM newtab_groups WHERE user_id = ? ORDER BY position ASC'
      )
        .bind(userId)
        .all<GroupRow>()

      // 获取文件夹
      const { results: folders } = await context.env.DB.prepare(
        'SELECT * FROM newtab_folders WHERE user_id = ? ORDER BY position ASC'
      )
        .bind(userId)
        .all<FolderRow>()

      // 获取设置
      const settings = await context.env.DB.prepare(
        'SELECT * FROM newtab_settings WHERE user_id = ?'
      )
        .bind(userId)
        .first<SettingsRow>()

      // 获取网格组件
      const { results: gridItems } = await context.env.DB.prepare(
        'SELECT * FROM newtab_grid_items WHERE user_id = ? ORDER BY position ASC'
      )
        .bind(userId)
        .all<GridItemRow>()

      return success({
        shortcuts: shortcuts || [],
        groups: groups || [],
        folders: folders || [],
        settings: settings
          ? {
              columns: settings.columns,
              style: settings.style,
              showTitle: settings.show_title === 1,
              backgroundType: settings.background_type,
              backgroundValue: settings.background_value,
              backgroundBlur: settings.background_blur,
              backgroundDim: settings.background_dim,
              showSearch: settings.show_search === 1,
              showClock: settings.show_clock === 1,
              showWeather: settings.show_weather === 1,
              showTodo: settings.show_todo === 1,
              showHotSearch: settings.show_hot_search === 1,
              showPinnedBookmarks: settings.show_pinned_bookmarks === 1,
              searchEngine: settings.search_engine,
              useWidgetGrid: settings.use_widget_grid === 1,
            }
          : null,
        gridItems: (gridItems || []).map((item) => ({
          id: item.id,
          type: item.type,
          size: item.size,
          position: item.position,
          groupId: item.group_id,
          shortcut: item.shortcut_url
            ? {
                url: item.shortcut_url,
                title: item.shortcut_title || '',
                favicon: item.shortcut_favicon || undefined,
              }
            : undefined,
          config: item.config ? JSON.parse(item.config) : undefined,
          createdAt: item.created_at,
        })),
      })
    } catch (error) {
      console.error('Get sync data error:', error)
      return internalError('Failed to get sync data')
    }
  },
]

// POST /api/tab/newtab/sync - 同步所有 NewTab 数据
export const onRequestPost: PagesFunction<Env, RouteParams, ApiKeyAuthContext>[] = [
  requireApiKeyAuth('bookmarks.create'),
  async (context) => {
    const userId = context.data.user_id

    try {
      const body = (await context.request.json()) as SyncRequest
      const now = new Date().toISOString()

      // 同步分组
      if (body.groups && Array.isArray(body.groups)) {
        await context.env.DB.prepare('DELETE FROM newtab_groups WHERE user_id = ?')
          .bind(userId)
          .run()

        for (const item of body.groups) {
          const id = item.id || generateUUID()
          await context.env.DB.prepare(
            `INSERT INTO newtab_groups (id, user_id, name, icon, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              id,
              userId,
              sanitizeString(item.name, 50),
              sanitizeString(item.icon, 50),
              item.position,
              now,
              now
            )
            .run()
        }
      }

      // 同步文件夹
      if (body.folders && Array.isArray(body.folders)) {
        await context.env.DB.prepare('DELETE FROM newtab_folders WHERE user_id = ?')
          .bind(userId)
          .run()

        for (const item of body.folders) {
          const id = item.id || generateUUID()
          await context.env.DB.prepare(
            `INSERT INTO newtab_folders (id, user_id, group_id, name, icon, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              id,
              userId,
              item.group_id || null,
              sanitizeString(item.name, 100),
              item.icon ? sanitizeString(item.icon, 50) : null,
              item.position,
              now,
              now
            )
            .run()
        }
      }

      // 同步快捷方式
      if (body.shortcuts && Array.isArray(body.shortcuts)) {
        await context.env.DB.prepare('DELETE FROM newtab_shortcuts WHERE user_id = ?')
          .bind(userId)
          .run()

        for (const item of body.shortcuts) {
          const id = item.id || generateUUID()
          await context.env.DB.prepare(
            `INSERT INTO newtab_shortcuts (id, user_id, group_id, folder_id, title, url, favicon, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              id,
              userId,
              item.group_id || null,
              item.folder_id || null,
              sanitizeString(item.title, 200),
              sanitizeString(item.url, 2000),
              item.favicon ? sanitizeString(item.favicon, 2000) : null,
              item.position,
              now,
              now
            )
            .run()
        }
      }

      // 同步设置
      if (body.settings) {
        const s = body.settings
        await context.env.DB.prepare(
          `INSERT INTO newtab_settings (user_id, columns, style, show_title, background_type, background_value, 
           background_blur, background_dim, show_search, show_clock, show_weather, show_todo, 
           show_hot_search, show_pinned_bookmarks, search_engine, use_widget_grid, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
           columns = excluded.columns,
           style = excluded.style,
           show_title = excluded.show_title,
           background_type = excluded.background_type,
           background_value = excluded.background_value,
           background_blur = excluded.background_blur,
           background_dim = excluded.background_dim,
           show_search = excluded.show_search,
           show_clock = excluded.show_clock,
           show_weather = excluded.show_weather,
           show_todo = excluded.show_todo,
           show_hot_search = excluded.show_hot_search,
           show_pinned_bookmarks = excluded.show_pinned_bookmarks,
           search_engine = excluded.search_engine,
           use_widget_grid = excluded.use_widget_grid,
           updated_at = excluded.updated_at`
        )
          .bind(
            userId,
            s.columns ?? 6,
            s.style ?? 'card',
            s.showTitle !== false ? 1 : 0,
            s.backgroundType ?? 'gradient',
            s.backgroundValue ?? null,
            s.backgroundBlur ?? 0,
            s.backgroundDim ?? 20,
            s.showSearch !== false ? 1 : 0,
            s.showClock !== false ? 1 : 0,
            s.showWeather ? 1 : 0,
            s.showTodo ? 1 : 0,
            s.showHotSearch ? 1 : 0,
            s.showPinnedBookmarks !== false ? 1 : 0,
            s.searchEngine ?? 'google',
            s.useWidgetGrid ? 1 : 0,
            now
          )
          .run()
      }

      // 同步网格组件
      if (body.gridItems && Array.isArray(body.gridItems)) {
        await context.env.DB.prepare('DELETE FROM newtab_grid_items WHERE user_id = ?')
          .bind(userId)
          .run()

        for (const item of body.gridItems) {
          const id = item.id || generateUUID()
          await context.env.DB.prepare(
            `INSERT INTO newtab_grid_items (id, user_id, group_id, type, size, position, 
             shortcut_url, shortcut_title, shortcut_favicon, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              id,
              userId,
              item.group_id || null,
              sanitizeString(item.type, 50),
              sanitizeString(item.size, 10),
              item.position,
              item.shortcut?.url ? sanitizeString(item.shortcut.url, 2000) : null,
              item.shortcut?.title ? sanitizeString(item.shortcut.title, 200) : null,
              item.shortcut?.favicon ? sanitizeString(item.shortcut.favicon, 2000) : null,
              item.config ? JSON.stringify(item.config) : null,
              now,
              now
            )
            .run()
        }
      }

      return success({ message: 'Sync completed', synced_at: now })
    } catch (error) {
      console.error('Sync data error:', error)
      return internalError('Failed to sync data')
    }
  },
]
