import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { PidManager } from '../../shared/pid.js';

export async function stopCommand() {
  const pidFile = join(process.env.HOME || '', '.task-master', 'daemon.pid');
  const pidManager = new PidManager(pidFile);

  const pid = pidManager.getPid();
  if (pid) {
    try {
      console.log(`正在停止守护进程 (PID: ${pid})...`);
      process.kill(pid, 'SIGTERM');

      for (let i = 0; i < 50; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!pidManager.isRunning()) {
          console.log('守护进程已停止');
          return;
        }
      }

      console.log('进程未响应，强制停止...');
      process.kill(pid, 'SIGKILL');
      pidManager.remove();
      console.log('守护进程已强制停止');
      return;
    } catch (error) {
      console.error('通过 PID 停止失败:', error);
    }
  }

  console.log('尝试通过 launchd 停止服务...');
  try {
    execSync('launchctl unload ~/Library/LaunchAgents/com.task-master.plist', {
      stdio: 'inherit',
    });
    console.log('守护进程已停止（通过 launchd）');
  } catch (error) {
    console.log('守护进程未运行');
  }
}
