/**
 * Favicon 工具函数 - 兼容层
 * 
 * 注意：此文件为兼容旧代码保留，新代码请使用 @/lib/services/favicon
 */

import {
  getFaviconUrl as getUrl,
  downloadFavicon as download,
  batchDownloadFavicons as batchDownload,
  type BatchDownloadOptions,
} from '@/lib/services/favicon';

/**
 * 获取 favicon URL（优先使用本地 base64，否则使用在线 API）
 * @param shortcut 快捷方式对象
 * @returns favicon URL
 */
export function getFaviconUrl(shortcut: { 
  url: string; 
  favicon?: string; 
  faviconBase64?: string;
}): string {
  // 1. 优先使用本地 base64
  if (shortcut.faviconBase64) {
    return shortcut.faviconBase64;
  }

  // 2. 使用自定义 favicon（排除旧格式）
  if (shortcut.favicon) {
    if (!(shortcut.favicon.includes('icon.ooo') && shortcut.favicon.includes('&sz='))) {
      return shortcut.favicon;
    }
  }

  // 3. 使用新的统一服务
  return getUrl({ url: shortcut.url, size: 64 });
}

/**
 * 下载 favicon 并转换为 base64（带压缩）
 * @param url 网站 URL
 * @param maxSizeKB 最大大小（KB），默认 10KB
 * @returns base64 格式的图标，失败返回 null
 */
export async function downloadFavicon(
  url: string, 
  maxSizeKB: number = 10
): Promise<string | null> {
  return download(url, maxSizeKB);
}

/**
 * 批量下载并缓存 favicon
 * @param shortcuts 快捷方式列表
 * @param onProgress 进度回调
 */
export async function batchDownloadFavicons(
  shortcuts: Array<{ 
    id: string; 
    url: string; 
    favicon?: string; 
    faviconBase64?: string;
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const options: BatchDownloadOptions = {
    shortcuts,
    onProgress: onProgress 
      ? (current, total) => onProgress(current, total)
      : undefined,
  };
  
  const result = await batchDownload(options);
  return result.success;
}
