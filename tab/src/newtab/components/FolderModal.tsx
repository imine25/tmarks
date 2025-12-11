/**
 * 文件夹弹窗组件 - 液态玻璃效果
 * 支持内部拖拽排序和拖出文件夹
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShortcutFolder, Shortcut } from '../types';
import { Z_INDEX } from '../constants/z-index';
import { useNewtabStore } from '../hooks/useNewtabStore';

interface FolderModalProps {
  folder: ShortcutFolder;
  shortcuts: Shortcut[];
  onClose: () => void;
  onAddShortcut: () => void;
  onEditFolder: () => void;
  onDeleteFolder: () => void;
}

// 可排序的文件夹内项目
function SortableFolderItem({ 
  shortcut, 
  onRemove,
  onClick,
}: { 
  shortcut: Shortcut; 
  onRemove: (id: string) => void;
  onClick: (shortcut: Shortcut) => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shortcut.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  // 动态光泽效果
  useEffect(() => {
    const element = iconRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty('--mouse-x', `${x}%`);
      element.style.setProperty('--mouse-y', `${y}%`);
    };

    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
      onClick={() => !isDragging && onClick(shortcut)}
    >
      <div className="relative w-12 h-12">
        <div 
          ref={iconRef}
          className="w-full h-full rounded-xl liquid-glass-icon flex items-center justify-center overflow-hidden"
        >
          <div className="glass-refraction" />
          {shortcut.favicon ? (
            <img
              src={shortcut.favicon}
              alt={shortcut.title}
              className="w-[80%] h-[80%] object-contain rounded-lg relative z-10"
              draggable={false}
            />
          ) : (
            <div className="w-[80%] h-[80%] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg relative z-10">
              <span className="text-lg font-bold text-white">
                {shortcut.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* 移出按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(shortcut.id);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
          title="移出文件夹"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      <span className="text-[11px] text-white/80 truncate w-full text-center select-none">
        {shortcut.title}
      </span>
    </div>
  );
}

export function FolderModal({
  folder,
  shortcuts,
  onClose,
  onAddShortcut,
  onEditFolder,
  onDeleteFolder,
}: FolderModalProps) {
  const { incrementClickCount, updateShortcut } = useNewtabStore();
  const [isVisible, setIsVisible] = useState(false);
  const [localShortcuts, setLocalShortcuts] = useState(shortcuts);

  // 同步外部 shortcuts
  useEffect(() => {
    setLocalShortcuts(shortcuts);
  }, [shortcuts]);

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleShortcutClick = (shortcut: Shortcut) => {
    incrementClickCount(shortcut.id);
    window.location.href = shortcut.url;
  };

  const handleRemoveFromFolder = (shortcutId: string) => {
    updateShortcut(shortcutId, { folderId: undefined });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localShortcuts.findIndex(s => s.id === active.id);
    const newIndex = localShortcuts.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(localShortcuts, oldIndex, newIndex);
      setLocalShortcuts(newOrder);
      // 更新位置
      newOrder.forEach((s, i) => {
        updateShortcut(s.id, { position: i });
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center transition-all duration-200 ${
        isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
      }`}
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={handleClose}
    >
      <div
        className={`relative w-[340px] max-h-[70vh] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ 
          zIndex: Z_INDEX.MODAL_CONTENT,
          background: 'linear-gradient(145deg, rgba(40, 40, 60, 0.95), rgba(30, 30, 45, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            {folder.name}
            <span className="text-xs text-white/50">({shortcuts.length})</span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={onEditFolder}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="编辑文件夹"
            >
              <Edit2 className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={onDeleteFolder}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="删除文件夹"
            >
              <Trash2 className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* 快捷方式网格 */}
        <div className="flex-1 overflow-y-auto p-3">
          {localShortcuts.length === 0 ? (
            <div className="text-center py-8 text-white/50 text-sm">
              文件夹为空，点击下方添加快捷方式
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localShortcuts.map(s => s.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-4 gap-2">
                  {localShortcuts.map((shortcut) => (
                    <SortableFolderItem
                      key={shortcut.id}
                      shortcut={shortcut}
                      onRemove={handleRemoveFromFolder}
                      onClick={handleShortcutClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* 底部添加按钮 */}
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={onAddShortcut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-white/80 text-sm"
          >
            <Plus className="w-4 h-4" />
            添加快捷方式
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
