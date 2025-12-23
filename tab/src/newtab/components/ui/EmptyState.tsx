/**
 * iOS 风格空状态组件
 */

import { Inbox, Search, Bookmark, CheckSquare, FileText, TrendingUp } from 'lucide-react';

type EmptyStateType = 'default' | 'search' | 'bookmark' | 'todo' | 'notes' | 'hotsearch';

interface EmptyStateProps {
  type?: EmptyStateType;
  message?: string;
  description?: string;
}

const ICONS: Record<EmptyStateType, React.ReactNode> = {
  default: <Inbox className="w-8 h-8" />,
  search: <Search className="w-8 h-8" />,
  bookmark: <Bookmark className="w-8 h-8" />,
  todo: <CheckSquare className="w-8 h-8" />,
  notes: <FileText className="w-8 h-8" />,
  hotsearch: <TrendingUp className="w-8 h-8" />,
};

const DEFAULT_MESSAGES: Record<EmptyStateType, string> = {
  default: '暂无内容',
  search: '未找到结果',
  bookmark: '暂无书签',
  todo: '暂无待办事项',
  notes: '暂无笔记',
  hotsearch: '暂无数据',
};

export function EmptyState({
  type = 'default',
  message,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-white/40">
      <div className="mb-2 opacity-50">
        {ICONS[type]}
      </div>
      <p className="text-sm">{message || DEFAULT_MESSAGES[type]}</p>
      {description && (
        <p className="text-xs text-white/30 mt-1">{description}</p>
      )}
    </div>
  );
}
