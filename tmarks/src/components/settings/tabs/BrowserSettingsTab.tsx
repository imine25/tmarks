import { Chrome, Shield, ExternalLink, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BrowserSettingsTab() {
  const navigate = useNavigate()

  const handleDownload = (browser: 'chrome' | 'firefox' | 'edge' | 'opera' | 'brave' | '360' | 'qq' | 'sogou') => {
    const link = document.createElement('a')
    link.href = `/extensions/tmarks-extension-${browser}.zip`
    link.download = `tmarks-extension-${browser}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const browsers = [
    { id: 'chrome', name: 'Chrome', icon: Chrome, color: 'text-blue-500' },
    { id: 'edge', name: 'Edge', icon: Chrome, color: 'text-cyan-500' },
    { id: 'firefox', name: 'Firefox', icon: Chrome, color: 'text-orange-500' },
    { id: 'brave', name: 'Brave', icon: Chrome, color: 'text-orange-600' },
    { id: 'opera', name: 'Opera', icon: Chrome, color: 'text-red-500' },
    { id: '360', name: '360', icon: Chrome, color: 'text-green-500' },
    { id: 'qq', name: 'QQ', icon: Chrome, color: 'text-blue-600' },
    { id: 'sogou', name: '搜狗', icon: Chrome, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-6">
      {/* 浏览器插件 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">浏览器插件</h3>
            <p className="text-sm text-muted-foreground mt-1">
              安装浏览器扩展，快速保存和管理书签
            </p>
          </div>
          <button
            onClick={() => navigate('/extension')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            查看详情
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {browsers.map((browser) => {
            const Icon = browser.icon
            return (
              <button
                key={browser.id}
                onClick={() => handleDownload(browser.id as any)}
                className="p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-center group"
              >
                <Icon className={`w-10 h-10 mx-auto mb-2 ${browser.color}`} />
                <div className="text-sm font-medium mb-1">{browser.name}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                  <Download className="w-3 h-3" />
                  点击下载
                </div>
              </button>
            )
          })}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 提供 8 个浏览器专用版本，也可以使用 Chrome 通用版（支持所有基于 Chrome 的浏览器）
          </p>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 浏览器权限 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">浏览器权限</h3>
          <p className="text-sm text-muted-foreground mt-1">
            管理浏览器扩展的权限设置
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">书签访问权限</div>
              <div className="text-xs text-muted-foreground">
                允许扩展读取和保存浏览器书签
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">已授权</div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">标签页访问权限</div>
              <div className="text-xs text-muted-foreground">
                允许扩展访问当前打开的标签页信息
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">已授权</div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">存储权限</div>
              <div className="text-xs text-muted-foreground">
                允许扩展在本地存储数据
              </div>
            </div>
            <div className="text-xs text-blue-600 font-medium">已授权</div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              浏览器扩展说明
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 安装扩展后可以快速保存当前页面为书签</li>
              <li>• 支持批量导入浏览器现有书签</li>
              <li>• 所有权限都是必需的，用于提供完整功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
