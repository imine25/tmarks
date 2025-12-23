import { TMARKS_URLS } from '@/lib/constants/urls';

interface TMarksConfigSectionProps {
  formData: {
    bookmarkApiUrl: string;
    bookmarkApiKey: string;
  };
  setFormData: (data: any) => void;
}

export function TMarksConfigSection({ formData, setFormData }: TMarksConfigSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-tmarks-card-border)] bg-[color:var(--tab-options-tmarks-card-bg)] shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tab-options-tmarks-topbar-from)] via-[var(--tab-options-tmarks-topbar-via)] to-[var(--tab-options-tmarks-topbar-to)]" />

      <div className="p-6 pt-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--tab-options-title)]">同步设置</h2>
            <p className="mt-2 text-sm text-[var(--tab-options-text)]">
              配置同步服务端（TMarks）以同步书签与标签数据。
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[color:var(--tab-options-tmarks-badge-bg)] text-xs font-medium text-[var(--tab-options-tmarks-badge-text)]">
            推荐使用
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
            服务器地址
          </label>
          <input
            type="url"
            value={formData.bookmarkApiUrl}
            onChange={(e) => setFormData({ ...formData, bookmarkApiUrl: e.target.value })}
            placeholder={TMARKS_URLS.DEFAULT_BASE_URL}
            className="w-full px-3 py-2 border border-[var(--tab-options-tmarks-input-border)] rounded-lg bg-[var(--tab-options-tmarks-input-bg)] text-[var(--tab-options-tmarks-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-tmarks-input-ring)]"
          />
          <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
            <span className="font-medium">TMarks 官方地址：</span>
            <code className="ml-1 px-1.5 py-0.5 bg-[var(--tab-options-tmarks-code-bg)] rounded">{TMARKS_URLS.DEFAULT_BASE_URL}</code>
          </p>
          <div className="mt-2 p-3 bg-[var(--tab-options-tmarks-info-bg)] rounded-lg">
            <p className="text-xs text-[var(--tab-options-tmarks-info-text)] mb-2">
              <span className="font-semibold text-[var(--tab-options-tmarks-info-title)]">ℹ️ TMarks 说明：</span>
            </p>
            <ul className="text-xs text-[var(--tab-options-tmarks-info-text)] space-y-1">
              <li>• TMarks 是一个标签为主的书签导航</li>
              <li>• 支持多设备同步、标签管理、全文搜索等功能</li>
              <li>• 填写基础地址即可，系统会自动补全 /api 路径</li>
              <li>• 例如：<code className="px-1 bg-[var(--tab-options-tmarks-code-bg)] rounded">https://tmarks.669696.xyz</code></li>
            </ul>
          </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
            API Key
          </label>
          <input
            type="password"
            value={formData.bookmarkApiKey}
            onChange={(e) => setFormData({ ...formData, bookmarkApiKey: e.target.value })}
            placeholder="请输入 TMarks API Key"
            className="w-full px-3 py-2 border border-[var(--tab-options-tmarks-input-border)] rounded-lg bg-[var(--tab-options-tmarks-input-bg)] text-[var(--tab-options-tmarks-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-tmarks-input-ring)]"
          />
          <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
            在 TMarks 设置中生成 API Key
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
