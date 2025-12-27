<<<<<<< HEAD
/**
 * 批量编辑快捷方式弹窗
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FolderInput, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from './ui/ConfirmModal';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { Z_INDEX } from '../constants/z-index';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
}

export function BatchEditModal({ isOpen, onClose, selectedIds, onSelectedIdsChange }: BatchEditModalProps) {
  const { shortcutGroups, getFilteredGridItems, removeGridItem, updateGridItem, activeGroupId, currentFolderId, gridItems, cleanupAllEmptyFolders, cleanupEmptyGroups } =
    useNewtabStore();
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 与主界面视图一致：直接取当前视图的过滤结果
  const filteredItems = useMemo(() => {
    const inView = getFilteredGridItems();
    return inView.sort((a, b) => a.position - b.position);
  }, [getFilteredGridItems, activeGroupId, currentFolderId, gridItems]);

  useEffect(() => {
    if (!isOpen) {
      setTargetGroupId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    // 检查当前视图中的所有项目是否都已选中
    const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
    
    if (allSelected) {
      // 取消选择当前视图中的所有项目
      const next = new Set(selectedIds);
      filteredItems.forEach((i) => next.delete(i.id));
      onSelectedIdsChange(next);
    } else {
      // 选择当前视图中的所有项目
      const next = new Set(selectedIds);
      filteredItems.forEach((i) => next.add(i.id));
      onSelectedIdsChange(next);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    selectedIds.forEach(id => removeGridItem(id));
    onSelectedIdsChange(new Set());
    setShowDeleteConfirm(false);
  };

  const handleBatchMove = () => {
    if (selectedIds.size === 0 || !targetGroupId) return;
    
    selectedIds.forEach(id => {
      const item = gridItems.find(i => i.id === id);
      if (!item) return;
      
      // 如果目标分组和当前分组相同，且已经在根目录，跳过
      if (item.groupId === targetGroupId && !item.parentId) return;
      
      // 更新 groupId 和清除 parentId（移动到分组根目录）
      updateGridItem(id, { groupId: targetGroupId, parentId: undefined });
    });
    
    // cleanupEmptyGroups 会在 updateGridItem 后自动触发（如果需要的话）
    // 但 updateGridItem 本身不会触发，所以这里手动调用一次
    setTimeout(() => {
      cleanupAllEmptyFolders();
      cleanupEmptyGroups();
    }, 100);
    
    onSelectedIdsChange(new Set());
    onClose();
  };

  const handleComplete = () => {
    onSelectedIdsChange(new Set());
    setTargetGroupId('');
    onClose();
  };

  const isAllSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));

  return createPortal(
    <>
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2"
        style={{ zIndex: Z_INDEX.BATCH_EDIT_BAR }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl glass-dark shadow-2xl w-[min(920px,calc(100vw-32px))]"
          style={{
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 18px 42px rgba(0,0,0,0.42)',
          }}
        >
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs text-white/80"
          >
            {isAllSelected ? '取消全选' : '全选'}
          </button>

          <span className="flex items-center gap-1 text-xs text-white/70 min-w-[76px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            已选 {selectedIds.size}
          </span>

          <div className="h-5 w-px bg-white/15" />

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleComplete}
              className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-xs"
            >
              完成
            </button>
            <button
              onClick={handleComplete}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs text-white/80"
            >
              取消
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-30 text-xs"
            >
              删除
            </button>
          </div>

          <div className="h-5 w-px bg-white/15" />

          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <FolderInput className="w-4 h-4 text-white/70" />
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="bg-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none border border-white/15 min-w-[140px] max-w-[280px]"
            >
              <option value="">选择分组</option>
              {shortcutGroups.map((group) => (
                <option key={group.id} value={group.id} className="bg-slate-900 text-white">
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBatchMove}
              disabled={!targetGroupId || selectedIds.size === 0}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-medium transition-colors disabled:opacity-40"
            >
              移动
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除确认"
        message={`确定要删除选中的 ${selectedIds.size} 个快捷方式吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
        onConfirm={confirmBatchDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>,
    document.body
  );
}
=======
/**
 * 批量编辑快捷方式弹窗
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, FolderInput } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { Z_INDEX } from '../constants/z-index';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchEditModal({ isOpen, onClose }: BatchEditModalProps) {
  const { shortcutGroups, removeShortcut, updateShortcut, getFilteredShortcuts } = useNewtabStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  const filteredShortcuts = getFilteredShortcuts();

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setTargetGroupId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredShortcuts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShortcuts.map(s => s.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个快捷方式吗？`)) return;
    
    selectedIds.forEach(id => removeShortcut(id));
    setSelectedIds(new Set());
  };

  const handleBatchMove = () => {
    if (selectedIds.size === 0 || !targetGroupId) return;
    
    selectedIds.forEach(id => {
      updateShortcut(id, { groupId: targetGroupId });
    });
    setSelectedIds(new Set());
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 animate-fadeIn"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl glass-modal-dark flex flex-col overflow-hidden"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">批量编辑快捷方式</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-white/5">
          <button
            onClick={handleSelectAll}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            {selectedIds.size === filteredShortcuts.length ? '取消全选' : '全选'}
          </button>
          <span className="text-sm text-white/50">
            已选择 {selectedIds.size} 项
          </span>
          <div className="flex-1" />
          <button
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            删除选中
          </button>
        </div>

        {/* 快捷方式列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {filteredShortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                onClick={() => handleToggleSelect(shortcut.id)}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all
                  ${selectedIds.has(shortcut.id) 
                    ? 'bg-blue-500/20 border-2 border-blue-500' 
                    : 'glass hover:bg-white/10 border-2 border-transparent'
                  }
                `}
              >
                {/* 选中标记 */}
                {selectedIds.has(shortcut.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* 图标 */}
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  <img
                    src={shortcut.favicon}
                    alt={shortcut.title}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-letter')) {
                        const span = document.createElement('span');
                        span.className = 'fallback-letter text-lg font-medium text-white/70';
                        span.textContent = shortcut.title.charAt(0).toUpperCase();
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>

                {/* 标题 */}
                <span className="text-xs text-white/80 truncate max-w-full text-center">
                  {shortcut.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部操作栏 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 px-6 py-4 border-t border-white/10 bg-white/5">
            <FolderInput className="w-5 h-5 text-white/70" />
            <span className="text-sm text-white/70">移动到：</span>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">选择分组</option>
              {shortcutGroups.map((group) => (
                <option key={group.id} value={group.id} className="bg-gray-800">
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBatchMove}
              disabled={!targetGroupId}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              移动
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
>>>>>>> 466a3a00e4a5595851c6537580d9a27eeeea9e75
