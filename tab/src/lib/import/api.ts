/**
 * 导入 API 调用
 */

import type { ParsedBookmark, ImportOptions, ImportResult } from '@/types/import'

/**
 * 导入书签到 TMarks
 */
export async function importToTMarks(
  bookmarks: ParsedBookmark[],
  options: ImportOptions,
  tmarksUrl: string,
  accessToken?: string
): Promise<ImportResult> {
  // 构建 TMarks JSON 格式的导入数据
  const tmarksData = {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    bookmarks: bookmarks.map((b) => ({
      title: b.title,
      url: b.url,
      description: b.description || '',
      tags: b.tags || [],
      created_at: b.created_at || new Date().toISOString()
    })),
    tags: [], // 标签会自动从书签中提取
    tab_groups: [] // 暂不支持标签页组
  }

  // 构建请求数据（后端需要的格式）
  const importData = {
    format: 'json' as const, // 使用 JSON 格式
    content: JSON.stringify(tmarksData), // 将数据转为字符串
    options
  }

  // 调用 API
  const url = `${tmarksUrl}/api/v1/import`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(importData)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Import failed' }))
    throw new Error(error.message || `Import failed with status ${response.status}`)
  }

  return await response.json()
}
