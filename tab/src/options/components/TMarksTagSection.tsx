import { DEFAULT_PROMPT_TEMPLATE } from '@/lib/constants/prompts';

interface TMarksTagSectionProps {
  formData: {
    enableAI: boolean;
    maxSuggestedTags: number;
    enableCustomPrompt: boolean;
    customPrompt: string;
  };
  setFormData: (data: any) => void;
  setSuccessMessage: (msg: string | null) => void;
}

export function TMarksTagSection({ formData, setFormData, setSuccessMessage }: TMarksTagSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tab-options-modal-topbar-from)] via-[var(--tab-options-modal-topbar-via)] to-[var(--tab-options-modal-topbar-to)]" />

      <div className="p-6 pt-10 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--tab-options-title)]">TMarks 标签推荐</h2>
          <p className="mt-2 text-sm text-[var(--tab-options-text)]">
            配置 TMarks 侧的标签推荐（保存书签时生成标签）。
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)]">
                启用 AI 标签推荐
              </label>
              <p className="mt-1 text-xs text-[var(--tab-options-text-muted)]">
                启用后，保存书签时自动调用 AI 分析页面并推荐标签。
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.enableAI}
              onClick={() => setFormData({ ...formData, enableAI: !formData.enableAI })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] focus:ring-offset-2 ${
                formData.enableAI ? 'bg-[var(--tab-options-button-primary-bg)]' : 'bg-[var(--tab-options-button-hover-bg)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--tab-options-switch-thumb)] shadow ring-0 transition duration-200 ease-in-out ${
                  formData.enableAI ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
              最大推荐标签数
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxSuggestedTags}
              onChange={(e) => setFormData({ ...formData, maxSuggestedTags: parseInt(e.target.value) })}
              disabled={!formData.enableAI}
              className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">范围 1-10。</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--tab-options-text)]">
                TMarks 标签 Prompt
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enableCustomPrompt: !formData.enableCustomPrompt })}
                disabled={!formData.enableAI}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  formData.enableAI && formData.enableCustomPrompt
                    ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] hover:bg-[var(--tab-options-button-primary-hover)]'
                    : 'bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-button-text)] hover:bg-[color:var(--tab-options-button-border)]'
                }`}
              >
                {formData.enableCustomPrompt ? '已启用' : '已禁用'}
              </button>
            </div>

            {formData.enableAI && formData.enableCustomPrompt && (
              <div className="space-y-3">
                <textarea
                  value={formData.customPrompt}
                  onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] font-mono text-xs"
                  placeholder="自定义 AI 提示词..."
                />

                <div className="p-3 bg-[color:var(--tab-options-tag-bg)] rounded-lg">
                  <p className="text-xs font-medium text-[var(--tab-options-pill-text)] mb-1">💡 专业示例 Prompt：</p>
                  <pre className="text-xs text-[var(--tab-options-text-muted)] whitespace-pre-wrap max-h-32 overflow-y-auto">
{DEFAULT_PROMPT_TEMPLATE}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customPrompt: DEFAULT_PROMPT_TEMPLATE });
                      }}
                      className="text-xs px-2 py-1 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] rounded-md transition-colors duration-200"
                    >
                      使用此示例
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(DEFAULT_PROMPT_TEMPLATE).then(() => {
                          setSuccessMessage('示例 Prompt 已复制到剪贴板');
                          setTimeout(() => setSuccessMessage(null), 2000);
                        });
                      }}
                      className="text-xs px-2 py-1 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] rounded-md transition-colors duration-200"
                    >
                      复制示例
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
