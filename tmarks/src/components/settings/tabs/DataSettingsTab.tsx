import { Database, Download, Upload, Trash2, FileJson, FileCode, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DataSettingsTab() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* 数据管理 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">数据导入导出</h3>
          <p className="text-sm text-muted-foreground mt-1">
            导入、导出和备份你的书签数据
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* 导出数据 */}
          <button
            onClick={() => navigate('/import-export')}
            className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="text-base font-semibold text-foreground">导出数据</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              将书签导出为文件，支持多种格式
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                <FileJson className="w-3 h-3" />
                JSON
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                <FileCode className="w-3 h-3" />
                HTML
              </span>
            </div>
          </button>

          {/* 导入数据 */}
          <button
            onClick={() => navigate('/import-export')}
            className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                <Upload className="w-6 h-6 text-success" />
              </div>
              <div className="text-base font-semibold text-foreground">导入数据</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              从浏览器或其他来源导入书签
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                浏览器书签
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                JSON/HTML
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 导出功能说明 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">导出功能</h3>
          <p className="text-sm text-muted-foreground mt-1">
            支持多种格式，满足不同需求
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <FileJson className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">JSON 格式</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 包含完整数据，适合备份和迁移</div>
                <div>• 可选择包含标签、元数据等信息</div>
                <div>• 支持重新导入到本系统</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">HTML 格式</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 兼容浏览器标准格式</div>
                <div>• 可直接导入 Chrome、Firefox、Edge 等浏览器</div>
                <div>• 保留文件夹结构和书签层级</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 导入功能说明 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">导入功能</h3>
          <p className="text-sm text-muted-foreground mt-1">
            从多种来源导入书签数据
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Upload className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">支持的格式</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 浏览器导出的 HTML 书签文件</div>
                <div>• JSON 格式的书签数据</div>
                <div>• 自动检测和跳过重复书签</div>
                <div>• 可将文件夹结构转换为标签</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Database className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">智能处理</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 支持批量处理大文件</div>
                <div>• 自动提取书签元数据</div>
                <div>• 保留创建时间和描述信息</div>
                <div>• 显示详细的导入结果报告</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 存储信息 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">存储信息</h3>
          <p className="text-sm text-muted-foreground mt-1">
            查看当前数据使用情况
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">-</div>
            <div className="text-xs text-muted-foreground">书签总数</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="text-2xl font-bold text-success mb-1">-</div>
            <div className="text-xs text-muted-foreground">标签总数</div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">-</div>
            <div className="text-xs text-muted-foreground">存储空间</div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 危险操作 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-error">危险操作</h3>
          <p className="text-sm text-muted-foreground mt-1">
            这些操作不可恢复，请谨慎使用
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-error/20 bg-error/5">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">清空所有数据</div>
              <div className="text-xs text-muted-foreground mb-3">
                删除所有书签、标签和相关数据，此操作不可恢复
              </div>
              <button className="btn btn-sm bg-error text-white hover:bg-error/90">
                清空数据
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 注意事项 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              注意事项
            </h4>
            <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• 导入前建议先导出当前数据作为备份</li>
              <li>• 大文件导入可能需要较长时间，请耐心等待</li>
              <li>• 导入过程中请勿关闭页面</li>
              <li>• 如遇到问题，可查看错误详情进行排查</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 使用提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              数据管理建议
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 建议定期导出数据作为备份（推荐每月一次）</li>
              <li>• 导入数据时会自动去重，不会产生重复书签</li>
              <li>• 所有数据都存储在云端，可以在多设备间同步</li>
              <li>• JSON 格式保留最完整的数据，HTML 格式兼容性最好</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
