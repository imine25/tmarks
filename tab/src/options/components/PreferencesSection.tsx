interface PreferencesSectionProps {
  formData: {
    theme: 'light' | 'dark' | 'auto';
    themeStyle: 'default' | 'bw' | 'tmarks';
    defaultVisibility: 'public' | 'private';
    defaultIncludeThumbnail: boolean;
    defaultCreateSnapshot: boolean;
    tagTheme: 'classic' | 'mono' | 'bw';
  };
  setFormData: (data: any) => void;
}

export function PreferencesSection({ formData, setFormData }: PreferencesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tab-options-modal-topbar-from)] via-[var(--tab-options-modal-topbar-via)] to-[var(--tab-options-modal-topbar-to)]" />

        <div className="p-6 pt-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--tab-options-title)]">外观设置</h2>
            <p className="mt-2 text-sm text-[var(--tab-options-text)]">配置扩展的主题与样式。</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-2">主题</label>
              <div className="inline-flex rounded-xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-1 text-sm font-medium text-[var(--tab-options-text)]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: 'auto' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.theme === 'auto'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  跟随
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: 'light' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.theme === 'light'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  浅色
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: 'dark' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.theme === 'dark'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  深色
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">控制扩展的明暗模式。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-2">主题样式</label>
              <div className="inline-flex rounded-xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-1 text-sm font-medium text-[var(--tab-options-text)]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themeStyle: 'default' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.themeStyle === 'default'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  默认
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themeStyle: 'bw' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.themeStyle === 'bw'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  黑白
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themeStyle: 'tmarks' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.themeStyle === 'tmarks'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  TMarks
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">切换扩展的配色方案。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-2">标签样式</label>
              <div className="inline-flex rounded-xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-1 text-sm font-medium text-[var(--tab-options-text)]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tagTheme: 'classic' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.tagTheme === 'classic'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  经典
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tagTheme: 'mono' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.tagTheme === 'mono'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  纯文字
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tagTheme: 'bw' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.tagTheme === 'bw'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  黑白
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">弹窗内标签展示风格。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tab-options-modal-topbar-from)] via-[var(--tab-options-modal-topbar-via)] to-[var(--tab-options-modal-topbar-to)]" />

        <div className="p-6 pt-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--tab-options-title)]">保存默认值</h2>
            <p className="mt-2 text-sm text-[var(--tab-options-text)]">配置保存书签时的默认选项。</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-2">默认可见性</label>
              <div className="inline-flex rounded-xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-1 text-sm font-medium text-[var(--tab-options-text)]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultVisibility: 'public' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.defaultVisibility === 'public'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  公开
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultVisibility: 'private' })}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    formData.defaultVisibility === 'private'
                      ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                      : 'hover:text-[var(--tab-options-title)]'
                  }`}
                >
                  隐私
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">保存书签时的默认可见性。</p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[color:var(--tab-options-card-border)]">
              <div>
                <label className="block text-sm font-medium text-[var(--tab-options-text)]">默认包含封面图</label>
                <p className="mt-1 text-xs text-[var(--tab-options-text-muted)]">保存时是否包含页面封面图。</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.defaultIncludeThumbnail}
                onClick={() => setFormData({ ...formData, defaultIncludeThumbnail: !formData.defaultIncludeThumbnail })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] focus:ring-offset-2 ${
                  formData.defaultIncludeThumbnail ? 'bg-[var(--tab-options-button-primary-bg)]' : 'bg-[var(--tab-options-button-hover-bg)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--tab-options-switch-thumb)] shadow ring-0 transition duration-200 ease-in-out ${
                    formData.defaultIncludeThumbnail ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[color:var(--tab-options-card-border)]">
              <div>
                <label className="block text-sm font-medium text-[var(--tab-options-text)]">默认创建快照</label>
                <p className="mt-1 text-xs text-[var(--tab-options-text-muted)]">保存时是否创建网页快照。</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.defaultCreateSnapshot}
                onClick={() => setFormData({ ...formData, defaultCreateSnapshot: !formData.defaultCreateSnapshot })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] focus:ring-offset-2 ${
                  formData.defaultCreateSnapshot ? 'bg-[var(--tab-options-button-primary-bg)]' : 'bg-[var(--tab-options-button-hover-bg)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--tab-options-switch-thumb)] shadow ring-0 transition duration-200 ease-in-out ${
                    formData.defaultCreateSnapshot ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
