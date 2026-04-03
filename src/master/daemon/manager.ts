import fs from 'node:fs';
import path from 'node:path';
import { PidManager } from '../../shared/index.js';
import { pino } from 'pino';
import { runDaemonCore } from './core';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// 启动守护进程
export async function startDaemon(foreground = false): Promise<void> {
  const pidFile = path.join(process.env.HOME || '', '.task-master', 'daemon.pid');
  const pidManager = new PidManager(pidFile);

  // 检查是否已经在运行
  if (pidManager.isRunning()) {
    logger.error({ pid: pidManager.getPid() }, '守护进程已在运行');
    process.exit(1);
  }

  // 如果不是前台模式，fork 子进程
  if (!foreground) {
    const { fork } = await import('node:child_process');
    const child = fork(process.argv[1], ['start', '--foreground'], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    // 重定向输出到日志文件
    const logDir = path.join(process.env.HOME || '', '.task-master');
    fs.mkdirSync(logDir, { recursive: true });

    const stdout = fs.createWriteStream(path.join(logDir, 'stdout.log'), { flags: 'a' });
    const stderr = fs.createWriteStream(path.join(logDir, 'stderr.log'), { flags: 'a' });

    child.stdout?.pipe(stdout);
    child.stderr?.pipe(stderr);

    // 监听子进程退出
    child.on('exit', (code, signal) => {
      if (code !== 0) {
        logger.error({ code, signal }, '子进程异常退出');
      }
    });

    child.unref();
    logger.info({ pid: child.pid }, '守护进程已在后台启动');
    return;
  }

  // 前台模式：保存当前进程 PID 并运行核心守护进程逻辑
  pidManager.write(process.pid);
  logger.info({ pid: process.pid }, '前台模式启动');
  await runDaemonCore(logger, pidManager);
}
