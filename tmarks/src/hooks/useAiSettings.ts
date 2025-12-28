/**
 * AI 设置 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiSettingsService, type UpdateAISettingsRequest, type TestAIConnectionRequest } from '@/services/ai-settings'

// 查询 Key
const AI_SETTINGS_KEY = ['ai-settings']

/**
 * 获取 AI 设置
 */
export function useAiSettings() {
  return useQuery({
    queryKey: AI_SETTINGS_KEY,
    queryFn: () => aiSettingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 分钟
  })
}

/**
 * 更新 AI 设置
 */
export function useUpdateAiSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateAISettingsRequest) => aiSettingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEY })
    }
  })
}

/**
 * 测试 AI 连接
 */
export function useTestAiConnection() {
  return useMutation({
    mutationFn: (data: TestAIConnectionRequest) => aiSettingsService.testConnection(data)
  })
}
