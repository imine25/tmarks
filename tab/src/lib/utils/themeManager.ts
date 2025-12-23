type ThemePreference = 'light' | 'dark' | 'auto';
type ThemeStyle = 'default' | 'bw' | 'tmarks';

const THEME_STYLE_CLASSES: Record<ThemeStyle, string> = {
  default: 'theme-default',
  bw: 'theme-bw',
  tmarks: 'theme-tmarks'
};

export function applyThemeStyle(themeStyle: ThemeStyle): void {
  const root = document.documentElement;
  Object.values(THEME_STYLE_CLASSES).forEach((cls) => root.classList.remove(cls));
  root.classList.add(THEME_STYLE_CLASSES[themeStyle]);
}

/**
 * 根据用户偏好设置应用主题类到根元素
 * @param theme - 用户主题偏好：light / dark / auto
 */
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // auto: 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

/**
 * 初始化主题并监听系统主题变化（仅在 auto 模式下生效）
 * @param getTheme - 获取当前主题偏好的函数
 * @returns cleanup 函数，用于移除监听器
 */
export function initThemeListener(getTheme: () => ThemePreference): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = () => {
    const theme = getTheme();
    if (theme === 'auto') {
      applyTheme('auto');
    }
  };

  mediaQuery.addEventListener('change', handler);

  // 初始应用
  applyTheme(getTheme());

  return () => mediaQuery.removeEventListener('change', handler);
}
