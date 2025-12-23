/**
 * 重试工具 - 支持指数退避
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

/**
 * 使用指数退避重试执行异步操作
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffFactor,
  } = { ...DEFAULT_OPTIONS, ...options };
  
  const { shouldRetry, onRetry } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 检查是否应该重试
      if (attempt >= maxRetries) {
        break;
      }

      if (shouldRetry && !shouldRetry(error, attempt)) {
        break;
      }

      // 通知重试
      onRetry?.(error, attempt, delay);

      // 等待后重试
      await sleep(delay);

      // 计算下次延迟（指数退避）
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // 网络错误
    if (message.includes('network') || message.includes('fetch')) {
      return true;
    }
    
    // 超时错误
    if (message.includes('timeout') || message.includes('timed out')) {
      return true;
    }
    
    // 服务端临时错误
    if (message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }
  }

  return false;
}

/**
 * 休眠指定毫秒
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
