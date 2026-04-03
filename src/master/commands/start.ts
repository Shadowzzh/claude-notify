import { startDaemon } from '../daemon/manager.js';

export async function startCommand(options: { foreground?: boolean }) {
  try {
    await startDaemon(options.foreground);
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}
