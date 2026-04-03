/**
 * 启动轮询兜底
 */
export function startPolling(callback: () => Promise<void>, interval: number): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await callback();
    } catch (err) {
      console.error('轮询扫描失败:', err);
    }
  }, interval);
}
