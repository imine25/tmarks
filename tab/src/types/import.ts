/**
 * 导入功能类型定义
 */

// 解析后的书签
export interface ParsedBookmark {
  title: string
  url: string
  description?: string
  tags: string[]
  created_at?: string
  folder?: string
}

// 导入选项
export interface ImportOptions {
  includeThumbnail?: boolean
  createSnapshot?: boolean
  generateTags?: boolean
  skip_duplicates?: boolean
  create_missing_tags?: boolean
  preserve_timestamps?: boolean
  folder_as_tag?: boolean
}

// 导入错误
export interface ImportError {
  index: number
  item: {
    title: string
    url: string
    tags: string[]
  }
  error: string
  code: string
}

// 导入结果
export interface ImportResult {
  success: number
  failed: number
  skipped: number
  total: number
  errors: ImportError[]
  created_bookmarks: any[]
  created_tags: any[]
  created_tab_groups: any[]
  tab_groups_success: number
  tab_groups_failed: number
}

// 导入格式
export type ImportFormat = 'html' | 'json'

