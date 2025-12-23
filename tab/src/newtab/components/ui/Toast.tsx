/**
 * iOS 风格 Toast 组件
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { Z_INDEX } from '../../constants/z-index';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <Check className="w-5 h-5" />,
  error: <X className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return createPortal(
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 transition-all duration-200 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ zIndex: Z_INDEX.MODAL_CONTENT + 20 }}
    >
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-xl ${COLORS[type]}`}
      >
        {ICONS[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>,
    document.body
  );
}

// Toast 管理器 - 用于全局调用
type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  show: (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    toasts.push({ id, message, type, duration });
    notifyListeners();
    return id;
  },
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration),
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
  remove: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  },
  subscribe: (listener: (toasts: ToastItem[]) => void) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  },
};

// Toast 容器组件 - 放在应用根部
export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(setItems);
  }, []);

  return (
    <>
      {items.map((item) => (
        <Toast
          key={item.id}
          message={item.message}
          type={item.type}
          duration={item.duration}
          onClose={() => toast.remove(item.id)}
        />
      ))}
    </>
  );
}
