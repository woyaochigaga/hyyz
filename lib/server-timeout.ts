const DEFAULT_TIMEOUT_MESSAGE = "请求处理超时，请稍后重试";

export class ServerTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(message = DEFAULT_TIMEOUT_MESSAGE, timeoutMs = 0) {
    super(message);
    this.name = "ServerTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isServerTimeoutError(error: unknown): error is ServerTimeoutError {
  return error instanceof ServerTimeoutError;
}

export async function withServerTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  message = DEFAULT_TIMEOUT_MESSAGE
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new ServerTimeoutError(message, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
