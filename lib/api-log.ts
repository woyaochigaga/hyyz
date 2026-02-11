export function logApi(
  name: string,
  step: string,
  extra?: Record<string, any>
) {
  const time = new Date().toISOString();
  const payload = extra ? ` ${JSON.stringify(extra)}` : "";
  // 统一 API 日志格式，方便在终端过滤
  console.log(`[API][${name}][${step}][${time}]${payload}`);
}

