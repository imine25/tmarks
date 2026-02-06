/**
 * 浏览器扩展构建配置
 * 
 * 只构建 Chrome 版本（兼容所有 Chromium 内核浏览器）
 */

export const buildConfig = {
  // 输出目录
  output: {
    // 构建输出目录（临时）
    distDir: 'dist',
    // TMarks public 目录
    publicDir: '../tmarks/public/extensions',
  },

  // 浏览器版本配置
  browsers: [
    {
      // 浏览器标识
      id: 'chrome',
      // 显示名称
      name: 'Chrome',
      // 描述
      description: 'Google Chrome 及所有 Chromium 内核浏览器（Chrome、Edge、Brave、Opera、360、QQ、搜狗等）',
      // Manifest 文件路径
      manifest: 'manifest.json',
      // 输出文件名
      outputFile: 'tmarks-extension-chrome.zip',
      // 图标颜色（用于文档）
      color: 'blue',
      // 是否启用
      enabled: true,
      // 支持的浏览器列表
      supportedBrowsers: [
        'Chrome 88+',
        'Edge 88+',
        'Brave 88+',
        'Opera 74+',
        '360浏览器',
        'QQ浏览器',
        '搜狗浏览器',
        '其他 Chromium 内核浏览器'
      ],
      // 分类
      category: 'chromium',
    },
  ],

  // 构建选项
  buildOptions: {
    // 压缩级别 (0-9)
    compressionLevel: 9,
    // 是否显示详细日志
    verbose: true,
    // 是否在构建前清理
    clean: true,
  },

  // 版本信息
  version: {
    number: '1.0.2',
    date: '2026-02-06',
  },
}

/**
 * 获取启用的浏览器配置
 */
export function getEnabledBrowsers() {
  return buildConfig.browsers.filter(browser => browser.enabled)
}

/**
 * 根据 ID 获取浏览器配置
 */
export function getBrowserConfig(id) {
  return buildConfig.browsers.find(browser => browser.id === id)
}

/**
 * 获取所有浏览器 ID
 */
export function getAllBrowserIds() {
  return buildConfig.browsers.map(browser => browser.id)
}

/**
 * 验证配置
 */
export function validateConfig() {
  const errors = []
  
  buildConfig.browsers.forEach(browser => {
    if (!browser.id) {
      errors.push('浏览器配置缺少 id')
    }
    if (!browser.name) {
      errors.push(`浏览器 ${browser.id} 缺少 name`)
    }
    if (!browser.manifest) {
      errors.push(`浏览器 ${browser.id} 缺少 manifest`)
    }
    if (!browser.outputFile) {
      errors.push(`浏览器 ${browser.id} 缺少 outputFile`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}
