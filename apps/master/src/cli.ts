#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PidManager } from '@task/shared';
import cac from 'cac';
import { startDaemon } from './daemon/manager';
import { installService } from './service/install';
import { uninstallService } from './service/uninstall';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

const cli = cac('task-master');

cli
  .version(version)
  .help()
  .command('start', '启动守护进程')
  .option('--foreground', '前台运行（不作为守护进程）')
  .action(async (options) => {
    try {
      await startDaemon(options.foreground);
    } catch (error) {
      console.error('启动失败:', error);
      process.exit(1);
    }
  });

cli.command('stop', '停止守护进程').action(async () => {
  try {
    await stopDaemon();
  } catch (error) {
    console.error('停止失败:', error);
    process.exit(1);
  }
});

cli.command('install-service', '安装为系统服务 (LaunchAgent)').action(async () => {
  try {
    await installService();
  } catch (error) {
    console.error('安装失败:', error);
    process.exit(1);
  }
});

cli.command('uninstall-service', '卸载系统服务').action(async () => {
  try {
    await uninstallService();
  } catch (error) {
    console.error('卸载失败:', error);
    process.exit(1);
  }
});

cli.command('status', '查看服务状态').action(async () => {
  try {
    await showStatus();
  } catch (error) {
    console.error('查看状态失败:', error);
    process.exit(1);
  }
});

cli.parse();

async function stopDaemon() {
  const pidFile = join(process.env.HOME || '', '.task-master', 'daemon.pid');
  const pidManager = new PidManager(pidFile);

  // 方式1: 尝试通过 PID 文件停止
  const pid = pidManager.getPid();
  if (pid) {
    try {
      console.log(`正在停止守护进程 (PID: ${pid})...`);
      process.kill(pid, 'SIGTERM');

      // 等待进程退出（最多 5 秒）
      for (let i = 0; i < 50; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!pidManager.isRunning()) {
          console.log('守护进程已停止');
          return;
        }
      }

      // 超时后强制杀死
      console.log('进程未响应，强制停止...');
      process.kill(pid, 'SIGKILL');
      pidManager.remove();
      console.log('守护进程已强制停止');
      return;
    } catch (error) {
      console.error('通过 PID 停止失败:', error);
    }
  }

  // 方式2: 尝试通过 launchctl 停止
  console.log('尝试通过 launchd 停止服务...');
  const { execSync } = await import('node:child_process');
  try {
    execSync('launchctl unload ~/Library/LaunchAgents/com.task-master.plist', {
      stdio: 'inherit',
    });
    console.log('守护进程已停止（通过 launchd）');
  } catch (error) {
    console.log('守护进程未运行');
  }
}

async function showStatus() {
  const pidFile = join(process.env.HOME || '', '.task-master', 'daemon.pid');
  const pidManager = new PidManager(pidFile);

  console.log('=== Task Master 状态 ===\n');

  // 检查 PID 文件
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

  // 检查 launchd 服务
  console.log('\n--- LaunchAgent 状态 ---');
  const { execSync } = await import('node:child_process');
  try {
    const output = execSync('launchctl list | grep task-master', { encoding: 'utf-8' });
    console.log('✓ LaunchAgent 已加载');
    console.log(`  ${output.trim()}`);
  } catch (error) {
    console.log('✗ LaunchAgent 未加载');
  }
}
