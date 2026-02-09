/**
 * Favicon 服务 - 统一的图标获取模块
 * 
 * 特性：
 * - 多 API 源支持（国内外可用）
 * - 智能降级策略
 * - 离线缓存支持
 * - 自动压缩优化
 * - 批量下载功能
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface FaviconSource {
  id: string;
  name: string;
  priority: number; // 优先级，数字越小越优先
  available: boolean; // 是否可用
  getUrl: (domain: string, size?: number) => string;
  needsProxy?: boolean; // 是否需要代理
}

export interface FaviconOptions {
  url: string;
  size?: number; // 图标尺寸
  maxSizeKB?: number; // 最大文件大小（用于缓存）
  useCache?: boolean; // 是否使用缓存
  sources?: string[]; // 指定使用的 API 源
}

export interface FaviconResult {
  url: string; // 图标 URL 或 base64
  source: string; // 使用的 API 源
  cached: boolean; // 是否来自缓存
  size?: number; // 文件大小（字节）
}

// ============================================================================
// API 源配置
// ============================================================================

/**
 * 可用的 Favicon API 源
 * 按优先级排序：本地 > 浏览器 API > 国内可用 > 国外服务
 */
export const FAVICON_SOURCES: FaviconSource[] = [
  // 1. Chrome 浏览器内置 API（最快，仅限 Chromium NewTab）
  {
    id: 'chrome-favicon',
    name: 'Chrome Favicon API',
    priority: 1,
    available: false, // 运行时检测
    getUrl: (_domain: string, size = 64) => {
      // 需要完整 URL，由调用方处理
      return `chrome://favicon2/?size=${size}&page_url=`;
    },
  },

  // 2. Google Favicon API（稳定，国内大部分可用）
  {
    id: 'google',
    name: 'Google Favicon API',
    priority: 2,
    available: true,
    getUrl: (domain: string, size = 64) => 
      `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
  },

  // 3. DuckDuckGo（隐私友好，国内可用）
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo Icons',
    priority: 3,
    available: true,
    getUrl: (domain: string) => 
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  },

  // 4. Favicon.im（国内镜像，专为中国优化）
  {
    id: 'favicon-im',
    name: 'Favicon.im',
    priority: 4,
    available: true,
    getUrl: (domain: string, size = 64) => 
      `https://api.favicon.im/${domain}?size=${size}`,
  },

  // 5. 网站自身 favicon（直接访问）
  {
    id: 'direct',
    name: 'Direct Favicon',
    priority: 5,
    available: true,
    getUrl: (domain: string) => 
      `https://${domain}/favicon.ico`,
  },

  // 6. icon.ooo（高质量，但可能需要代理）
  {
    id: 'icon-ooo',
    name: 'Icon.ooo',
    priority: 6,
    available: true,
    needsProxy: true,
    getUrl: (domain: string, size = 64) => 
      `https://icon.ooo/${domain}?size=${size}&v=1`,
  },
];

// ============================================================================
// 环境检测
// ============================================================================

/**
 * 检测当前运行环境
 */
function detectEnvironment() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isFirefox = ua.includes('firefox');
  const isChromium =
    !isFirefox &&
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).chrome !== 'undefined' &&
    !!(globalThis as any).chrome?.runtime?.id;

  const href = typeof location !== 'undefined' ? location.href : '';
  const isNewtabPage = href.includes('/src/newtab/') || href.includes('/newtab/');

  return {
    isFirefox,
    isChromium,
    isNewtabPage,
    canUseChromeFavicon: isChromium && isNewtabPage,
  };
}

/**
 * 更新 API 源的可用性
 */
export function updateSourceAvailability() {
  const env = detectEnvironment();
  
  // 更新 Chrome Favicon API 的可用性
  const chromeSource = FAVICON_SOURCES.find(s => s.id === 'chrome-favicon');
  if (chromeSource) {
    chromeSource.available = env.canUseChromeFavicon;
  }
}

// ============================================================================
// 核心功能
// ============================================================================

/**
 * 从 URL 提取域名
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 获取可用的 API 源列表（按优先级排序）
 */
function getAvailableSources(specifiedSources?: string[]): FaviconSource[] {
  updateSourceAvailability();
  
  let sources = FAVICON_SOURCES.filter(s => s.available);
  
  // 如果指定了特定源，只使用这些源
  if (specifiedSources && specifiedSources.length > 0) {
    sources = sources.filter(s => specifiedSources.includes(s.id));
  }
  
  // 按优先级排序
  return sources.sort((a, b) => a.priority - b.priority);
}

/**
 * 获取 Favicon URL
 * 
 * @param options - 配置选项
 * @returns Favicon URL
 */
export function getFaviconUrl(options: FaviconOptions): string {
  const { url, size = 64, sources: specifiedSources } = options;
  
  const domain = extractDomain(url);
  if (!domain) return '';
  
  const availableSources = getAvailableSources(specifiedSources);
  if (availableSources.length === 0) return '';
  
  // 使用优先级最高的源
  const source = availableSources[0];
  
  // Chrome Favicon API 需要完整 URL
  if (source.id === 'chrome-favicon') {
    return `${source.getUrl(domain, size)}${encodeURIComponent(url)}`;
  }
  
  return source.getUrl(domain, size);
}

/**
 * 尝试从多个源获取 Favicon
 * 
 * @param options - 配置选项
 * @returns Promise<FaviconResult>
 */
export async function fetchFavicon(options: FaviconOptions): Promise<FaviconResult | null> {
  const { url, size = 64, sources: specifiedSources } = options;
  
  const domain = extractDomain(url);
  if (!domain) return null;
  
  const availableSources = getAvailableSources(specifiedSources);
  
  // 依次尝试每个源
  for (const source of availableSources) {
    try {
      let faviconUrl: string;
      
      if (source.id === 'chrome-favicon') {
        faviconUrl = `${source.getUrl(domain, size)}${encodeURIComponent(url)}`;
      } else {
        faviconUrl = source.getUrl(domain, size);
      }
      
      const response = await fetch(faviconUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        
        // 检查是否是有效图片（大于 100 字节）
        if (blob.size > 100) {
          return {
            url: faviconUrl,
            source: source.id,
            cached: false,
            size: blob.size,
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch favicon from ${source.name}:`, error);
      continue;
    }
  }
  
  return null;
}

// 初始化时更新源可用性
updateSourceAvailability();

// ============================================================================
// 图片处理
// ============================================================================

/**
 * 将 Blob 转换为 Base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 压缩图片到指定大小
 */
async function compressImage(blob: Blob, maxSizeKB: number = 10): Promise<string | null> {
  try {
    // 如果原始图片已经很小，直接返回
    if (blob.size <= maxSizeKB * 1024) {
      return await blobToBase64(blob);
    }

    // 创建图片对象
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = objectUrl;
    });

    // 创建 canvas 进行压缩
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 保持原始尺寸，但使用较低的质量
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 尝试不同的质量级别
    let quality = 0.8;
    let base64 = '';
    
    while (quality > 0.1) {
      base64 = canvas.toDataURL('image/jpeg', quality);
      const sizeKB = (base64.length * 3) / 4 / 1024;
      
      if (sizeKB <= maxSizeKB) {
        break;
      }
      
      quality -= 0.1;
    }

    URL.revokeObjectURL(objectUrl);
    
    // 如果压缩后仍然太大，返回 null
    const finalSizeKB = (base64.length * 3) / 4 / 1024;
    if (finalSizeKB > maxSizeKB * 1.5) {
      console.warn(`Icon too large after compression: ${finalSizeKB.toFixed(2)}KB`);
      return null;
    }
    
    return base64;
  } catch (error) {
    console.error('Failed to compress image:', error);
    return null;
  }
}

/**
 * 下载 Favicon 并转换为 base64（带压缩）
 */
export async function downloadFavicon(
  url: string,
  maxSizeKB: number = 10,
  sources?: string[]
): Promise<string | null> {
  try {
    const domain = extractDomain(url);
    if (!domain) return null;
    
    const availableSources = getAvailableSources(sources);
    
    // 依次尝试每个源
    for (const source of availableSources) {
      try {
        // Chrome Favicon API 不适合下载（无法跨域）
        if (source.id === 'chrome-favicon') continue;
        
        const faviconUrl = source.getUrl(domain, 32); // 使用较小尺寸
        const response = await fetch(faviconUrl);
        
        if (!response.ok) continue;
        
        const blob = await response.blob();
        
        // 检查是否是有效图片
        if (blob.size < 100) continue;
        
        // 压缩图片
        const base64 = await compressImage(blob, maxSizeKB);
        if (base64) {
          return base64;
        }
      } catch (error) {
        console.warn(`Failed to download from ${source.name}:`, error);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to download favicon:', error);
    return null;
  }
}

// ============================================================================
// 批量处理
// ============================================================================

export interface BatchDownloadOptions {
  shortcuts: Array<{
    id: string;
    url: string;
    favicon?: string;
    faviconBase64?: string;
  }>;
  maxSizeKB?: number;
  sources?: string[];
  onProgress?: (current: number, total: number, id: string) => void;
  onError?: (id: string, error: Error) => void;
  delayMs?: number; // 请求间隔（避免过快）
}

export interface BatchDownloadResult {
  success: Map<string, string>; // id -> base64
  failed: Set<string>; // 失败的 id
  skipped: Set<string>; // 跳过的 id（已有缓存）
}

/**
 * 批量下载并缓存 Favicon
 */
export async function batchDownloadFavicons(
  options: BatchDownloadOptions
): Promise<BatchDownloadResult> {
  const {
    shortcuts,
    maxSizeKB = 10,
    sources,
    onProgress,
    onError,
    delayMs = 100,
  } = options;
  
  const result: BatchDownloadResult = {
    success: new Map(),
    failed: new Set(),
    skipped: new Set(),
  };
  
  let current = 0;
  
  for (const shortcut of shortcuts) {
    // 跳过已有 base64 的
    if (shortcut.faviconBase64) {
      result.skipped.add(shortcut.id);
      current++;
      onProgress?.(current, shortcuts.length, shortcut.id);
      continue;
    }
    
    try {
      const base64 = await downloadFavicon(shortcut.url, maxSizeKB, sources);
      
      if (base64) {
        result.success.set(shortcut.id, base64);
      } else {
        result.failed.add(shortcut.id);
      }
    } catch (error) {
      result.failed.add(shortcut.id);
      onError?.(shortcut.id, error as Error);
    }
    
    current++;
    onProgress?.(current, shortcuts.length, shortcut.id);
    
    // 避免请求过快
    if (delayMs > 0 && current < shortcuts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return result;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取 Favicon URL（兼容旧接口）
 * 
 * @deprecated 使用 getFaviconUrl({ url, size }) 代替
 */
export function getFaviconUrlLegacy(shortcut: {
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

  // 3. 使用新的 API
  return getFaviconUrl({ url: shortcut.url, size: 64 });
}

/**
 * 测试 API 源的可用性
 */
export async function testSourceAvailability(
  sourceId: string,
  testDomain: string = 'github.com'
): Promise<boolean> {
  const source = FAVICON_SOURCES.find(s => s.id === sourceId);
  if (!source) return false;
  
  try {
    const url = source.getUrl(testDomain, 32);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 获取所有 API 源的状态
 */
export async function getAllSourcesStatus(): Promise<
  Array<{ id: string; name: string; available: boolean; tested: boolean }>
> {
  const results = await Promise.allSettled(
    FAVICON_SOURCES.map(async source => ({
      id: source.id,
      name: source.name,
      available: source.available,
      tested: await testSourceAvailability(source.id),
    }))
  );
  
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);
}
