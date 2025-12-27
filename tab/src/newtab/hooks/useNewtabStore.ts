<<<<<<< HEAD
/**
 * NewTab 状态管理
 * 
 * 使用拆分后的模块化 actions
 */

import { create } from 'zustand';
import type { NewTabStorage } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEY, DEFAULT_GROUPS } from '../constants';

import {
  type NewTabState,
  hasBookmarksApi,
  isHomeRootItem,
  getWritableRootBookmarkId,
  debouncedSync,
} from './store';

import { ensureHomeFolder } from '../features/browser-sync';

import { createShortcutActions } from './store/actions/shortcuts';
import { createGroupActions } from './store/actions/groups';
import { createFolderActions } from './store/actions/folders';
import { createGridItemActions } from './store/actions/grid-items';
import { createBrowserBookmarkActions } from './store/actions/browser-bookmarks';
import { createNavigationActions } from './store/actions/navigation';

export { ensureHomeFolder } from '../features/browser-sync';

export const useNewtabStore = create<NewTabState>((set, get) => {
  // ============================================
  // 内部辅助函数
  // ============================================
  
  const ensureHomeFolderId = async (): Promise<string | null> => {
    const state = get();
    if (!state.browserBookmarksRootId) return null;
    let homeFolderId = state.homeBrowserFolderId;
    if (homeFolderId) return homeFolderId;
    const ensured = await ensureHomeFolder(state.browserBookmarksRootId);
    if (!ensured) return null;
    homeFolderId = ensured.id;
    state.setHomeBrowserFolderId(homeFolderId);
    return homeFolderId;
  };

  const ensureGroupFolderId = async (
    groupId: string,
    options?: { createIfMissing?: boolean; bookmarkFolderIdOverride?: string | null }
  ): Promise<string | null> => {
    const state = get();
    if (!hasBookmarksApi()) return null;
    if (!state.browserBookmarksRootId) return null;
    if (groupId === 'home') {
      return ensureHomeFolderId();
    }

    const group = state.shortcutGroups.find((g) => g.id === groupId);
    if (!group) return null;

    const verifyFolder = async (folderId?: string): Promise<string | null> => {
      if (!folderId) return null;
      try {
        const nodes = await chrome.bookmarks.get(folderId);
        const node = nodes?.[0];
        if (node && !node.url) return folderId;
      } catch {}
      return null;
    };

    const existing = await verifyFolder(
      options?.bookmarkFolderIdOverride ?? group.bookmarkFolderId ?? undefined
    );
    if (existing) return existing;

    const rootId = state.browserBookmarksRootId;
    if (!rootId) return null;

    try {
      const children = await chrome.bookmarks.getChildren(rootId);
      const matched = children.find((c) => !c.url && c.title === group.name);
      if (matched) {
        state.setGroupBookmarkFolderId(groupId, matched.id);
        return matched.id;
      }
    } catch {}

    if (options?.createIfMissing) {
      try {
        state.setBrowserBookmarkWriteLockUntil(Date.now() + 1200);
        const created = await chrome.bookmarks.create({
          parentId: rootId,
          title: group.name,
        });
        if (created?.id) {
          state.setGroupBookmarkFolderId(groupId, created.id);
          return created.id;
        }
      } catch (error) {
        console.warn('[NewTab] Failed to create bookmark folder for group:', group.name, error);
      }
    }
    return null;
  };

  const inferGroupIdFromBookmarkParent = (parentBookmarkId?: string): string => {
    const state = get();
    if (!parentBookmarkId) return 'home';
    if (parentBookmarkId === state.homeBrowserFolderId) return 'home';
    const matchedGroup = state.shortcutGroups.find((g) => g.bookmarkFolderId === parentBookmarkId);
    if (matchedGroup) return matchedGroup.id;
    const parentGrid = state.gridItems.find(
      (item) => item.browserBookmarkId === parentBookmarkId && item.type === 'bookmarkFolder'
    );
    return parentGrid?.groupId ?? 'home';
  };

  const isRootContainerBookmarkId = (bookmarkId?: string | null) => {
    if (!bookmarkId) return false;
    const state = get();
    if (bookmarkId === state.homeBrowserFolderId) return true;
    return state.shortcutGroups.some((group) => group.bookmarkFolderId === bookmarkId);
  };

  const resolveBookmarkParentId = async (opts: {
    parentGridId?: string | null;
    inferredGroupId?: string | null;
  }): Promise<string | null> => {
    const state = get();
    if (!state.browserBookmarksRootId) return null;

    if (opts.parentGridId) {
      const parentGrid = state.gridItems.find((i) => i.id === opts.parentGridId);
      if (parentGrid?.browserBookmarkId) return parentGrid.browserBookmarkId;
    }

    const groupId = opts.inferredGroupId ?? state.activeGroupId ?? 'home';
    if ((opts.parentGridId ?? null) === null) {
      if (groupId === 'home') {
        const homeId = await ensureHomeFolderId();
        if (homeId) return homeId;
      } else {
        const groupFolderId = await ensureGroupFolderId(groupId);
        if (groupFolderId) return groupFolderId;
      }
    }

    if (groupId === 'home') {
      const homeId = await ensureHomeFolderId();
      if (homeId) return homeId;
    } else {
      const groupFolderId = await ensureGroupFolderId(groupId);
      if (groupFolderId) return groupFolderId;
    }

    const writable = await getWritableRootBookmarkId(state.browserBookmarksRootId);
    return writable ?? state.browserBookmarksRootId;
  };

  const mirrorHomeItemToBrowser = async (itemId: string) => {
    const state = get();
    if (!hasBookmarksApi()) return;
    if (!state.browserBookmarksRootId) return;
    const item = state.gridItems.find((i) => i.id === itemId);
    if (!item) return;
    if (item.browserBookmarkId) return;
    if (!isHomeRootItem(item)) return;
    if (item.type === 'shortcut' && !item.shortcut?.url) return;

    const parentBookmarkId = await ensureHomeFolderId();
    if (!parentBookmarkId) return;

    state.setBrowserBookmarkWriteLockUntil(Date.now() + 1200);
    try {
      let created: chrome.bookmarks.BookmarkTreeNode | undefined;
      if (item.type === 'bookmarkFolder') {
        created = await chrome.bookmarks.create({
          parentId: parentBookmarkId,
          title: item.bookmarkFolder?.title || '文件夹',
        });
      } else if (item.type === 'shortcut') {
        created = await chrome.bookmarks.create({
          parentId: parentBookmarkId,
          title: item.shortcut?.title || item.shortcut?.url || '快捷方式',
          url: item.shortcut?.url,
        });
      }

      if (!created?.id) return;

      set({
        gridItems: get().gridItems.map((gridItem) =>
          gridItem.id === item.id ? { ...gridItem, browserBookmarkId: created!.id } : gridItem
        ),
      });
      state.saveData();
    } catch (e) {
      console.warn('[NewTab] Failed to mirror home item to browser:', e);
    }
  };

  // ============================================
  // 创建模块化 Actions
  // ============================================
  
  const shortcutActions = createShortcutActions(get as any, set as any);
  const groupActions = createGroupActions(get as any, set as any, ensureGroupFolderId);
  const folderActions = createFolderActions(get as any, set as any);
  const gridItemActions = createGridItemActions(set as any, get as any, resolveBookmarkParentId);
  const browserBookmarkActions = createBrowserBookmarkActions(
    set as any,
    get as any,
    inferGroupIdFromBookmarkParent,
    isRootContainerBookmarkId
  );
  const navigationActions = createNavigationActions(set as any, get as any, resolveBookmarkParentId);

  // ============================================
  // Store 返回值
  // ============================================
  
  return {
    // 初始状态
    shortcuts: [],
    shortcutGroups: DEFAULT_GROUPS,
    shortcutFolders: [],
    activeGroupId: 'home',
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    gridItems: [],
    currentFolderId: null,
    browserBookmarksRootId: null,
    homeBrowserFolderId: null,
    isApplyingBrowserBookmarks: false,
    browserBookmarkWriteLockUntil: 0,

    // 数据加载/保存
    loadData: async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const data = result[STORAGE_KEY] as NewTabStorage | undefined;

        const groups = data?.shortcutGroups?.length ? data.shortcutGroups : DEFAULT_GROUPS;

        let activeGroupId = data?.activeGroupId;
        if (!activeGroupId || !groups.some((g) => g.id === activeGroupId)) {
          activeGroupId = groups[0]?.id || 'home';
        }

        const settings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) };

        set({
          shortcuts: data?.shortcuts || [],
          shortcutGroups: groups,
          shortcutFolders: data?.shortcutFolders || [],
          activeGroupId,
          settings,
          gridItems: data?.gridItems || [],
          currentFolderId: null,
          browserBookmarksRootId: null,
          homeBrowserFolderId: null,
          isApplyingBrowserBookmarks: false,
          browserBookmarkWriteLockUntil: 0,
          isLoading: false,
        });

        if (!data) {
          const { saveData } = get();
          saveData();
        }
      } catch (error) {
        console.error('Failed to load newtab data:', error);
        set({ isLoading: false });
      }
    },

    saveData: async () => {
      const { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems } = get();
      const data: NewTabStorage = { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems };

      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: data });
      } catch (error) {
        console.error('Failed to save newtab data:', error);
      }
    },

    // 设置操作
    updateSettings: (updates) => {
      const { shortcutGroups, settings, gridItems, saveData } = get();
      const newSettings = { ...settings, ...updates };
      set({ settings: newSettings });
      saveData();
      debouncedSync({ groups: shortcutGroups, gridItems });
    },

    // 快捷方式 Actions
    ...shortcutActions,

    // 分组 Actions
    ...groupActions,
    ensureGroupBookmarkFolderId: ensureGroupFolderId,

    // 文件夹 Actions
    ...folderActions,

    // Grid Items Actions
    ...gridItemActions,

    // Browser Bookmarks Actions
    ...browserBookmarkActions,

    // 导航 Actions
    ...navigationActions,

    // Mirror home items
    mirrorHomeItemsToBrowser: (ids) => {
      for (const id of ids) {
        mirrorHomeItemToBrowser(id);
      }
    },
  };
});
=======
/**
 * NewTab 状态管理
 */

import { create } from 'zustand';
import type { Shortcut, ShortcutGroup, ShortcutFolder, NewTabSettings, NewTabStorage, GridItem, GridItemType, GridItemSize } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEY, DEFAULT_GROUPS } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';
import { getWidgetMeta, getDefaultWidgetConfig } from '../components/widgets/widgetRegistry';

// 同步 NewTab 数据到后端（静默执行，不阻塞 UI）
async function syncNewtabToBackend(data: {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  folders: ShortcutFolder[];
  settings: NewTabSettings;
  gridItems: GridItem[];
}) {
  try {
    const configuredUrl = await StorageService.getBookmarkSiteApiUrl();
    const apiKey = await StorageService.getBookmarkSiteApiKey();

    if (!apiKey) {
      console.log('[NewTab Sync] 未配置 API Key，跳过同步');
      return;
    }

    const baseUrl = configuredUrl?.endsWith('/api')
      ? configuredUrl
      : getTMarksUrls(configuredUrl || undefined).API_BASE;

    const response = await fetch(`${baseUrl}/tab/newtab/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        shortcuts: data.shortcuts.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          favicon: s.favicon,
          group_id: s.groupId,
          folder_id: s.folderId,
          position: s.position,
        })),
        groups: data.groups.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          position: g.position,
        })),
        folders: data.folders.map((f) => ({
          id: f.id,
          name: f.name,
          icon: f.icon,
          group_id: f.groupId,
          position: f.position,
        })),
        settings: {
          columns: data.settings.shortcutColumns,
          style: data.settings.shortcutStyle,
          showTitle: true,
          backgroundType: data.settings.wallpaper.type,
          backgroundValue: data.settings.wallpaper.value,
          backgroundBlur: data.settings.wallpaper.blur,
          backgroundDim: data.settings.wallpaper.brightness,
          showSearch: data.settings.showSearch,
          showClock: data.settings.showClock,
          showPinnedBookmarks: data.settings.showPinnedBookmarks,
          searchEngine: data.settings.searchEngine,
        },
        gridItems: data.gridItems.map((item) => ({
          id: item.id,
          type: item.type,
          size: item.size,
          position: item.position,
          group_id: item.groupId,
          shortcut: item.shortcut,
          config: item.config,
        })),
      }),
    });

    if (response.ok) {
      console.log('[NewTab Sync] 数据已同步到后端');
    } else {
      console.warn('[NewTab Sync] 同步失败:', response.status);
    }
  } catch (error) {
    // 静默失败，不影响本地操作
    console.warn('[NewTab Sync] 同步失败:', error);
  }
}

// 防抖同步（避免频繁请求）
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSync(data: {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  folders: ShortcutFolder[];
  settings: NewTabSettings;
  gridItems: GridItem[];
}) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    syncNewtabToBackend(data);
  }, 2000); // 2秒防抖
}

interface NewTabState {
  // 数据
  shortcuts: Shortcut[];
  shortcutGroups: ShortcutGroup[];
  shortcutFolders: ShortcutFolder[];
  activeGroupId: string | null;
  settings: NewTabSettings;
  isLoading: boolean;
  gridItems: GridItem[];
  
  // Actions
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  
  // 快捷方式操作
  addShortcut: (shortcut: Omit<Shortcut, 'id' | 'position' | 'createdAt' | 'clickCount'>) => void;
  updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
  removeShortcut: (id: string) => void;
  reorderShortcuts: (fromIndex: number, toIndex: number) => void;
  incrementClickCount: (id: string) => void;
  
  // 分组操作
  setActiveGroup: (groupId: string | null) => void;
  addGroup: (name: string, icon: string) => void;
  updateGroup: (id: string, updates: Partial<ShortcutGroup>) => void;
  removeGroup: (id: string) => void;
  getFilteredShortcuts: () => Shortcut[];
  
  // 文件夹操作
  addFolder: (name: string, groupId?: string) => string;
  updateFolder: (id: string, updates: Partial<ShortcutFolder>) => void;
  removeFolder: (id: string) => void;
  getFolderShortcuts: (folderId: string) => Shortcut[];
  moveShortcutToFolder: (shortcutId: string, folderId: string | undefined) => void;
  
  // 设置操作
  updateSettings: (updates: Partial<NewTabSettings>) => void;

  // 网格项操作
  addGridItem: (type: GridItemType, options?: { size?: GridItemSize; groupId?: string; shortcut?: GridItem['shortcut'] }) => void;
  updateGridItem: (id: string, updates: Partial<GridItem>) => void;
  removeGridItem: (id: string) => void;
  reorderGridItems: (fromIndex: number, toIndex: number) => void;
  getFilteredGridItems: () => GridItem[];
  migrateToGridItems: () => void;
}

// 生成唯一 ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useNewtabStore = create<NewTabState>((set, get) => ({
  shortcuts: [],
  shortcutGroups: DEFAULT_GROUPS,
  shortcutFolders: [],
  activeGroupId: 'home', // 默认选中首页
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  gridItems: [],
  
  loadData: async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const data = result[STORAGE_KEY] as NewTabStorage | undefined;
      
      // 确保分组数据有效
      const groups = data?.shortcutGroups?.length ? data.shortcutGroups : DEFAULT_GROUPS;
      
      // 验证 activeGroupId 是否有效，如果无效则使用第一个分组
      let activeGroupId = data?.activeGroupId;
      if (!activeGroupId || !groups.some(g => g.id === activeGroupId)) {
        activeGroupId = groups[0]?.id || 'home';
      }
      
      // 合并设置，确保新增的设置项有默认值
      const settings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) };
      
      set({
        shortcuts: data?.shortcuts || [],
        shortcutGroups: groups,
        shortcutFolders: data?.shortcutFolders || [],
        activeGroupId,
        settings,
        gridItems: data?.gridItems || [],
        isLoading: false,
      });
      
      // 如果是首次加载（没有数据），保存默认数据
      if (!data) {
        const { saveData } = get();
        saveData();
      }
    } catch (error) {
      console.error('Failed to load newtab data:', error);
      set({ isLoading: false });
    }
  },
  
  saveData: async () => {
    const { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems } = get();
    const data: NewTabStorage = { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems };
    
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to save newtab data:', error);
    }
  },
  
  addShortcut: (shortcut) => {
    const { shortcuts, shortcutGroups, settings, gridItems, saveData } = get();
    const newShortcut: Shortcut = {
      ...shortcut,
      id: generateId(),
      position: shortcuts.length,
      createdAt: Date.now(),
      clickCount: 0,
    };

    const newShortcuts = [...shortcuts, newShortcut];
    set({ shortcuts: newShortcuts });
    saveData();

    // 异步下载并缓存 favicon
    (async () => {
      try {
        const { downloadFavicon } = await import('../utils/favicon');
        const base64 = await downloadFavicon(newShortcut.url);
        if (base64) {
          const { updateShortcut } = get();
          updateShortcut(newShortcut.id, { faviconBase64: base64 });
        }
      } catch (error) {
        console.error('Failed to cache favicon:', error);
      }
    })();

    // 异步同步到后端（防抖）
    const { shortcutFolders } = get();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },
  
  updateShortcut: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newShortcuts = shortcuts.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ shortcuts: newShortcuts });
    saveData();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },

  removeShortcut: (id) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const filtered = shortcuts.filter((s) => s.id !== id);
    const reordered = filtered.map((s, index) => ({ ...s, position: index }));
    set({ shortcuts: reordered });
    saveData();
    debouncedSync({ shortcuts: reordered, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },

  reorderShortcuts: (fromIndex, toIndex) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newShortcuts = [...shortcuts];
    const [removed] = newShortcuts.splice(fromIndex, 1);
    newShortcuts.splice(toIndex, 0, removed);
    const reordered = newShortcuts.map((s, index) => ({ ...s, position: index }));
    set({ shortcuts: reordered });
    saveData();
    debouncedSync({ shortcuts: reordered, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },
  
  incrementClickCount: (id) => {
    const { shortcuts, saveData } = get();
    set({
      shortcuts: shortcuts.map((s) =>
        s.id === id ? { ...s, clickCount: s.clickCount + 1 } : s
      ),
    });
    saveData();
  },
  
  updateSettings: (updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newSettings = { ...settings, ...updates };
    set({ settings: newSettings });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings: newSettings, gridItems });
  },

  // 分组操作
  setActiveGroup: (groupId) => {
    const { saveData } = get();
    set({ activeGroupId: groupId });
    saveData();
    // 不需要同步 activeGroupId，这是本地状态
  },

  addGroup: (name, icon) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGroup: ShortcutGroup = {
      id: generateId(),
      name,
      icon,
      position: shortcutGroups.length,
    };
    const newGroups = [...shortcutGroups, newGroup];
    set({ shortcutGroups: newGroups });
    saveData();
    debouncedSync({ shortcuts, groups: newGroups, folders: shortcutFolders, settings, gridItems });
  },

  updateGroup: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGroups = shortcutGroups.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ shortcutGroups: newGroups });
    saveData();
    debouncedSync({ shortcuts, groups: newGroups, folders: shortcutFolders, settings, gridItems });
  },

  removeGroup: (id) => {
    const { shortcutGroups, shortcutFolders, shortcuts, activeGroupId, settings, gridItems, saveData } = get();
    // 不允许删除首页分组
    if (id === 'home') {
      console.warn('不能删除首页分组');
      return;
    }
    // 删除分组时，将该分组的快捷方式移到首页
    const updatedShortcuts = shortcuts.map((s) =>
      s.groupId === id ? { ...s, groupId: 'home' } : s
    );
    const filtered = shortcutGroups.filter((g) => g.id !== id);
    set({
      shortcutGroups: filtered,
      shortcuts: updatedShortcuts,
      activeGroupId: activeGroupId === id ? 'home' : activeGroupId,
    });
    saveData();
    debouncedSync({ shortcuts: updatedShortcuts, groups: filtered, folders: shortcutFolders, settings, gridItems });
  },
  
  getFilteredShortcuts: () => {
    const { shortcuts, activeGroupId } = get();
    // 如果没有选中分组，默认显示首页分组
    const targetGroupId = activeGroupId ?? 'home';
    // 只返回不在文件夹内的快捷方式
    return shortcuts.filter((s) => s.groupId === targetGroupId && !s.folderId);
  },

  // 文件夹操作
  addFolder: (name, groupId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems, saveData } = get();
    const newFolder: ShortcutFolder = {
      id: generateId(),
      name,
      position: shortcutFolders.length,
      groupId: groupId ?? activeGroupId ?? undefined,
      createdAt: Date.now(),
    };
    const newFolders = [...shortcutFolders, newFolder];
    set({ shortcutFolders: newFolders });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: newFolders, settings, gridItems });
    return newFolder.id;
  },

  updateFolder: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newFolders = shortcutFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
    set({ shortcutFolders: newFolders });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: newFolders, settings, gridItems });
  },

  removeFolder: (id) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    // 删除文件夹时，将文件夹内的快捷方式移出
    const updatedShortcuts = shortcuts.map((s) =>
      s.folderId === id ? { ...s, folderId: undefined } : s
    );
    const filtered = shortcutFolders.filter((f) => f.id !== id);
    set({ shortcutFolders: filtered, shortcuts: updatedShortcuts });
    saveData();
    debouncedSync({ shortcuts: updatedShortcuts, groups: shortcutGroups, folders: filtered, settings, gridItems });
  },

  getFolderShortcuts: (folderId) => {
    const { shortcuts } = get();
    return shortcuts.filter((s) => s.folderId === folderId);
  },

  moveShortcutToFolder: (shortcutId, folderId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newShortcuts = shortcuts.map((s) =>
      s.id === shortcutId ? { ...s, folderId } : s
    );
    set({ shortcuts: newShortcuts });
    saveData();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },

  // 网格项操作
  addGridItem: (type, options = {}) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, activeGroupId, saveData } = get();
    const meta = getWidgetMeta(type);
    const defaultConfig = getDefaultWidgetConfig(type);
    
    const newItem: GridItem = {
      id: generateId(),
      type,
      size: options.size || meta.sizeConfig.defaultSize,
      position: gridItems.length,
      groupId: options.groupId ?? activeGroupId ?? undefined,
      shortcut: options.shortcut,
      config: type !== 'shortcut' ? defaultConfig : undefined,
      createdAt: Date.now(),
    };

    const newGridItems = [...gridItems, newItem];
    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

    // 如果是快捷方式类型，异步下载并缓存 favicon
    if (type === 'shortcut' && options.shortcut?.url) {
      (async () => {
        try {
          const { downloadFavicon } = await import('../utils/favicon');
          const base64 = await downloadFavicon(options.shortcut!.url);
          if (base64) {
            const { updateGridItem } = get();
            updateGridItem(newItem.id, {
              shortcut: {
                ...options.shortcut!,
                faviconBase64: base64,
              },
            });
          }
        } catch (error) {
          console.error('Failed to cache favicon for grid item:', error);
        }
      })();
    }
  },

  updateGridItem: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGridItems = gridItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });
  },

  removeGridItem: (id) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const filtered = gridItems.filter((item) => item.id !== id);
    const reordered = filtered.map((item, index) => ({ ...item, position: index }));
    set({ gridItems: reordered });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: reordered });
  },

  reorderGridItems: (fromIndex, toIndex) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGridItems = [...gridItems];
    const [removed] = newGridItems.splice(fromIndex, 1);
    newGridItems.splice(toIndex, 0, removed);
    const reordered = newGridItems.map((item, index) => ({ ...item, position: index }));
    set({ gridItems: reordered });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: reordered });
  },

  getFilteredGridItems: () => {
    const { gridItems, activeGroupId } = get();
    // 如果没有选中分组，默认显示首页分组
    const targetGroupId = activeGroupId ?? 'home';
    return gridItems.filter((item) => item.groupId === targetGroupId);
  },

  // 数据迁移：将旧的 shortcuts 迁移到 gridItems
  migrateToGridItems: () => {
    const { shortcuts, gridItems, saveData } = get();
    
    // 如果没有 shortcuts，不需要迁移
    if (shortcuts.length === 0) return;

    // 找出尚未迁移的快捷方式
    const existingShortcutIds = new Set(
      gridItems
        .filter(item => item.type === 'shortcut' && item.shortcut)
        .map(item => item.id)
    );

    const newShortcuts = shortcuts.filter(s => !existingShortcutIds.has(s.id));
    
    if (newShortcuts.length === 0) return;

    // 迁移新的快捷方式
    const migratedItems: GridItem[] = newShortcuts.map((shortcut, index) => ({
      id: shortcut.id,
      type: 'shortcut' as GridItemType,
      size: '1x1' as GridItemSize,
      position: gridItems.length + index,
      groupId: shortcut.groupId,
      shortcut: {
        url: shortcut.url,
        title: shortcut.title,
        favicon: shortcut.favicon,
      },
      createdAt: shortcut.createdAt,
    }));

    const newGridItems = [...gridItems, ...migratedItems];
    set({ gridItems: newGridItems });
    saveData();
    console.log('[NewTab] 已迁移', migratedItems.length, '个快捷方式到网格系统');
  },



  // 清空所有网格项
}));
>>>>>>> 466a3a00e4a5595851c6537580d9a27eeeea9e75
