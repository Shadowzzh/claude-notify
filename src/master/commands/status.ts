import { join } from 'node:path';
import { PidManager } from '../../shared/pid.js';
import { execSync } from 'node:child_process';

export async function statusCommand() {
  const pidFile = join(process.env.HOME || '', '.task-master', 'daemon.pid');
  const pidManager = new PidManager(pidFile);

  console.log('=== Task Master 状态 ===\n');

  const pid = pidManager.read();
  if (pid) {
    if (pidManager.isRunning()) {
      console.log('✓ 守护进程正在运行');
      console.log(`  PID: ${pid}`);
      console.log(`  PID 文件: ${pidFile}`);
    } else {
      console.log('✗ 守护进程未运行（PID 文件存在但进程已退出）');
      console.log(`  陈旧的 PID: ${pid}`);
    }
  } else {
    console.log('✗ 守护进程未运行（无 PID 文件）');
  }

  console.log('\n--- LaunchAgent 状态 ---');
  try {
    const output = execSync('launchctl list | grep task-master', { encoding: 'utf-8' });
    console.log('✓ LaunchAgent 已加载');
    console.log(`  ${output.trim()}`);
  } catch (error) {
    console.log('✗ LaunchAgent 未加载');
  }
}
