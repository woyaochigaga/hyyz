"use client";

type CacheEntry<T> = {
  data?: T;
  expiresAt: number;
  promise?: Promise<T>;
};

const requestCache = new Map<string, CacheEntry<unknown>>();

export async function getCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttlMs?: number;
    force?: boolean;
  }
): Promise<T> {
  const ttlMs = Math.max(0, options?.ttlMs ?? 0);
  const now = Date.now();
  const current = requestCache.get(key) as CacheEntry<T> | undefined;

  if (!options?.force && current?.data !== undefined && current.expiresAt > now) {
    return current.data;
  }

  if (!options?.force && current?.promise) {
    return current.promise;
  }

  const promise = fetcher()
    .then((data) => {
      requestCache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
      });
      return data;
    })
    .catch((error) => {
      const latest = requestCache.get(key) as CacheEntry<T> | undefined;
      if (latest?.promise === promise) {
        requestCache.delete(key);
      }
      throw error;
    });

  requestCache.set(key, {
    data: current?.data,
    expiresAt: current?.expiresAt ?? 0,
    promise,
  });

  return promise;
}

export function invalidateCachedResource(key: string) {
  requestCache.delete(key);
}

export function invalidateCachedResourcePrefix(prefix: string) {
  for (const key of Array.from(requestCache.keys())) {
    if (key.startsWith(prefix)) {
      requestCache.delete(key);
    }
  }
}
