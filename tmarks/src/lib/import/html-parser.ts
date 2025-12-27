/**
 * 前端 HTML 书签解析器
 * 用于在 AI 整理前解析书签文件
 */

import type { ParsedBookmark } from '@shared/import-export-types'

/**
 * 解析 HTML 书签文件
 */
export function parseHtmlBookmarks(content: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = []
  
  // 使用 DOMParser 解析 HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  
  // 递归解析书签
  function parseNode(node: Element, folderPath: string[] = []) {
    const children = node.children
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      
      if (child.tagName === 'DT') {
        // 检查是否是文件夹
        const h3 = child.querySelector(':scope > H3')
        if (h3) {
          const folderName = h3.textContent?.trim() || 'Folder'
          // 查找下一个 DL
          const dl = child.querySelector(':scope > DL')
          if (dl) {
            parseNode(dl, [...folderPath, folderName])
          }
          continue
        }
        
        // 检查是否是书签
        const a = child.querySelector(':scope > A')
        if (a) {
          const href = a.getAttribute('HREF')
          const title = a.textContent?.trim() || 'Untitled'
          
          // 跳过无效链接
          if (!href || href.startsWith('javascript:') || href.startsWith('data:')) {
            continue
          }
          
          // 获取标签
          const tagsAttr = a.getAttribute('TAGS')
          const tags: string[] = tagsAttr 
            ? tagsAttr.split(',').map(t => t.trim()).filter(Boolean)
            : []
          
          // 获取描述
          const dd = child.querySelector(':scope > DD')
          const description = dd?.textContent?.trim()
          
          // 获取创建时间
          const addDate = a.getAttribute('ADD_DATE')
          const createdAt = addDate 
            ? new Date(parseInt(addDate) * 1000).toISOString()
            : undefined
          
          bookmarks.push({
            title,
            url: href,
            description,
            tags,
            created_at: createdAt,
            folder: folderPath.length > 0 ? folderPath.join('/') : undefined
          })
        }
      } else if (child.tagName === 'DL') {
        parseNode(child, folderPath)
      }
    }
  }
  
  // 从根 DL 开始解析
  const rootDL = doc.querySelector('DL')
  if (rootDL) {
    parseNode(rootDL)
  }
  
  return bookmarks
}

/**
 * 解析 JSON 书签文件
 */
export function parseJsonBookmarks(content: string): ParsedBookmark[] {
  try {
    const data = JSON.parse(content)
    
    // TMarks 格式
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      return data.bookmarks.map((b: Record<string, unknown>) => ({
        title: String(b.title || 'Untitled'),
        url: String(b.url || ''),
        description: b.description ? String(b.description) : undefined,
        tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
        created_at: b.created_at ? String(b.created_at) : undefined,
        folder: b.folder ? String(b.folder) : undefined
      }))
    }
    
    // 简单数组格式
    if (Array.isArray(data)) {
      return data.map((b: Record<string, unknown>) => ({
        title: String(b.title || b.name || 'Untitled'),
        url: String(b.url || b.href || ''),
        description: b.description ? String(b.description) : undefined,
        tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
        created_at: b.created_at ? String(b.created_at) : undefined,
        folder: b.folder ? String(b.folder) : undefined
      }))
    }
    
    return []
  } catch {
    return []
  }
}

/**
 * 根据格式解析书签文件
 */
export function parseBookmarksFile(content: string, format: 'html' | 'json'): ParsedBookmark[] {
  if (format === 'html') {
    return parseHtmlBookmarks(content)
  } else {
    return parseJsonBookmarks(content)
  }
}
