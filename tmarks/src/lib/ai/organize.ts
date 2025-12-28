/**
 * AI 书签整理功能
 */

import { callAI, type AICallParams } from './client'
import type { AIProvider } from './constants'
import type { ParsedBookmark } from '@shared/import-export-types'

// 整理选项
export interface OrganizeOptions {
  generateTags: boolean
  generateDescription: boolean
  normalizeTags: boolean
  existingTags?: string[]
  batchSize?: number
}

// 整理后的书签
export interface OrganizedBookmark extends ParsedBookmark {
  ai_tags?: string[]
  ai_description?: string
  original_tags?: string[]
}

// 整理进度
export interface OrganizeProgress {
  current: number
  total: number
  status: 'preparing' | 'processing' | 'done' | 'error'
  message?: string
}

// 整理结果
export interface OrganizeResult {
  bookmarks: OrganizedBookmark[]
  newTags: string[]
  tokensUsed: number
}

// 构建整理提示词
function buildOrganizePrompt(
  bookmarks: ParsedBookmark[],
  options: OrganizeOptions
): string {
  const existingTagsStr = options.existingTags?.slice(0, 100).join('、') || '无'
  
  const bookmarksStr = bookmarks.map((b, i) => 
    `${i + 1}. 标题: ${b.title}\n   URL: ${b.url}${b.folder ? `\n   文件夹: ${b.folder}` : ''}`
  ).join('\n')

  let taskDescription = '为每个书签生成 2-5 个简洁的标签'
  if (options.generateDescription) {
    taskDescription += '，并生成简短描述'
  }

  return `你是一个书签整理专家。请分析以下书签列表，${taskDescription}。

要求：
1. 标签要简洁，每个标签 2-5 个汉字或常见英文单词
2. 标签要通用、易于分类，避免过于具体
3. 优先使用已有标签列表中的标签
4. 如果书签有文件夹信息，可以参考但不要直接使用长路径作为标签

已有标签：${existingTagsStr}

书签列表：
${bookmarksStr}

请以 JSON 格式返回，格式如下：
{
  "results": [
    {
      "index": 1,
      "tags": ["标签1", "标签2"],
      ${options.generateDescription ? '"description": "简短描述"' : ''}
    }
  ]
}

只返回 JSON，不要有其他内容。`
}

// 解析 AI 响应
function parseOrganizeResponse(
  content: string,
  bookmarks: ParsedBookmark[]
): OrganizedBookmark[] {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in AI response')
      return bookmarks.map(b => ({ ...b, ai_tags: [], original_tags: b.tags }))
    }

    const parsed = JSON.parse(jsonMatch[0])
    const results = parsed.results || []

    return bookmarks.map((bookmark, index) => {
      const result = results.find((r: { index: number }) => r.index === index + 1)
      return {
        ...bookmark,
        original_tags: bookmark.tags,
        ai_tags: result?.tags || [],
        ai_description: result?.description
      }
    })
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return bookmarks.map(b => ({ ...b, ai_tags: [], original_tags: b.tags }))
  }
}

// 分批整理书签
export async function* organizeBookmarks(
  bookmarks: ParsedBookmark[],
  aiConfig: {
    provider: AIProvider
    apiKey: string
    apiUrl?: string
    model?: string
  },
  options: OrganizeOptions,
  onProgress?: (progress: OrganizeProgress) => void
): AsyncGenerator<OrganizeProgress, OrganizeResult> {
  const batchSize = options.batchSize || 20
  const batches: ParsedBookmark[][] = []
  
  // 分批
  for (let i = 0; i < bookmarks.length; i += batchSize) {
    batches.push(bookmarks.slice(i, i + batchSize))
  }

  const allOrganized: OrganizedBookmark[] = []
  const allNewTags = new Set<string>()
  let totalTokens = 0
  let processedCount = 0

  // 初始进度
  yield {
    current: 0,
    total: bookmarks.length,
    status: 'preparing',
    message: '准备开始 AI 整理...'
  }

  // 处理每个批次
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    if (!batch) continue
    
    const progress: OrganizeProgress = {
      current: processedCount,
      total: bookmarks.length,
      status: 'processing',
      message: `正在处理第 ${i + 1}/${batches.length} 批...`
    }
    
    yield progress
    onProgress?.(progress)

    try {
      const prompt = buildOrganizePrompt(batch, options)
      
      const params: AICallParams = {
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        apiUrl: aiConfig.apiUrl,
        model: aiConfig.model,
        prompt,
        temperature: 0.3,
        maxTokens: 2000
      }

      const result = await callAI(params)
      const organized = parseOrganizeResponse(result.content, batch)
      
      allOrganized.push(...organized)
      
      // 收集新标签
      organized.forEach(b => {
        b.ai_tags?.forEach(tag => {
          if (!options.existingTags?.includes(tag)) {
            allNewTags.add(tag)
          }
        })
      })

      // 估算 token 消耗
      totalTokens += prompt.length / 4 + result.content.length / 4

      processedCount += batch.length

    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error)
      // 失败的批次保留原始数据
      allOrganized.push(...batch.map(b => ({ 
        ...b, 
        ai_tags: [], 
        original_tags: b.tags 
      })))
      processedCount += batch.length
    }
  }

  // 完成
  const finalProgress: OrganizeProgress = {
    current: bookmarks.length,
    total: bookmarks.length,
    status: 'done',
    message: 'AI 整理完成'
  }
  
  yield finalProgress
  onProgress?.(finalProgress)

  return {
    bookmarks: allOrganized,
    newTags: Array.from(allNewTags),
    tokensUsed: Math.round(totalTokens)
  }
}

// 估算 token 消耗
export function estimateTokens(bookmarks: ParsedBookmark[], options: OrganizeOptions): number {
  // 粗略估算：每个书签约 50 tokens 输入 + 30 tokens 输出
  const baseTokens = bookmarks.length * 80
  // 如果生成描述，增加 50%
  const multiplier = options.generateDescription ? 1.5 : 1
  return Math.round(baseTokens * multiplier)
}

// 估算费用（美元）
export function estimateCost(tokens: number, provider: AIProvider): number {
  // 各服务商大致价格（每 1M tokens）
  const prices: Record<AIProvider, number> = {
    openai: 0.15, // gpt-4o-mini
    claude: 0.25, // claude-3-haiku
    deepseek: 0.07,
    zhipu: 0.05,
    modelscope: 0.02,
    siliconflow: 0.03,
    iflow: 0.10,
    custom: 0.10
  }
  
  return (tokens / 1000000) * (prices[provider] || 0.10)
}
