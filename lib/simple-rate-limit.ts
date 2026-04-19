const memoryBuckets = new Map<string, number[]>();

export function checkSimpleRateLimit(params: {
  key: string;
  windowMs: number;
  max: number;
}) {
  const now = Date.now();
  const windowStart = now - params.windowMs;
  const history = memoryBuckets.get(params.key) || [];
  const nextHistory = history.filter((timestamp) => timestamp > windowStart);

  if (nextHistory.length >= params.max) {
    memoryBuckets.set(params.key, nextHistory);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1000, params.windowMs - (now - nextHistory[0])),
    };
  }

  nextHistory.push(now);
  memoryBuckets.set(params.key, nextHistory);

  return {
    allowed: true,
    remaining: Math.max(0, params.max - nextHistory.length),
    retryAfterMs: 0,
  };
}
