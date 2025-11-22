import { useState } from 'react';
import { Camera, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { useQueryClient } from '@tanstack/react-query';
import { BOOKMARKS_QUERY_KEY } from '@/hooks/useBookmarks';

interface Snapshot {
  id: string;
  version: number;
  file_size: number;
  snapshot_title: string;
  created_at: string;
}

interface SnapshotViewerProps {
  bookmarkId: string;
  bookmarkTitle: string;
  snapshotCount?: number; // 从书签数据中传入，避免额外请求
}

export function SnapshotViewer({ bookmarkId, bookmarkTitle, snapshotCount = 0 }: SnapshotViewerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const accessToken = useAuthStore(state => state.accessToken);
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/v1/bookmarks/${bookmarkId}/snapshots`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // API 返回格式: { data: { snapshots: [...], total: ... } }
      setSnapshots(result.data?.snapshots || []);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击
    setIsOpen(true);
    loadSnapshots();
  };

  const handleView = (snapshotId: string, version: number) => {
    // 构建带 token 的 URL
    const url = new URL(`/api/v1/bookmarks/${bookmarkId}/snapshots/${snapshotId}`, window.location.origin);
    
    if (accessToken) {
      url.searchParams.set('token', accessToken);
    }
    
    // 添加版本信息（用于 V2 图片加载）
    url.searchParams.set('v', version.toString());
    
    window.open(url.toString(), '_blank');
  };

  const handleDelete = async (snapshotId: string, version: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发查看操作
    
    if (!confirm(`确定要删除版本 ${version} 的快照吗？`)) {
      return;
    }

    setDeletingId(snapshotId);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/v1/bookmarks/${bookmarkId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 从列表中移除
      setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
      
      // 刷新书签列表（更新快照计数）
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] });
      
      addToast('success', '快照已删除');
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      addToast('error', '删除快照失败');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        title="查看快照"
      >
        <Camera className="w-3 h-3" strokeWidth={2} />
        <span className="font-medium">{snapshotCount}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
      <div className="relative w-full max-w-lg max-h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {bookmarkTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              共 {snapshots.length} 个快照
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无快照</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                >
                  <button
                    onClick={() => handleView(snapshot.id, snapshot.version)}
                    className="flex-1 flex items-center justify-between gap-3 text-left min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        版本 {snapshot.version}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(snapshot.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </div>
                    </div>
                    
                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </button>
                  
                  <button
                    onClick={(e) => handleDelete(snapshot.id, snapshot.version, e)}
                    disabled={deletingId === snapshot.id}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="删除快照"
                  >
                    {deletingId === snapshot.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
