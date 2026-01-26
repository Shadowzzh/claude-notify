import fs from 'node:fs';
import path from 'node:path';
import { MASTER_SEEN_FILE, loadMasterConfig } from '@task/shared';
import chokidar from 'chokidar';
import { pino } from 'pino';
import { processStatusFile } from './processor.js';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const seenTasks = new Map<string, Set<string>>();

// 加载去重记录
function loadSeenTasks(): void {
  try {
    if (fs.existsSync(MASTER_SEEN_FILE)) {
      const content = fs.readFileSync(MASTER_SEEN_FILE, 'utf-8');
      const data = JSON.parse(content);
      for (const [agent, tasks] of Object.entries(data)) {
        seenTasks.set(agent, new Set(tasks as string[]));
      }
    }
  } catch (error) {
    logger.warn({ error }, '加载 seen 记录失败，使用空记录');
  }
}

// 保存去重记录
function saveSeenTasks(): void {
  try {
    const data: Record<string, string[]> = {};
    for (const [agent, tasks] of seenTasks.entries()) {
      data[agent] = Array.from(tasks);
    }
    const dir = path.dirname(MASTER_SEEN_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MASTER_SEEN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error({ error }, '保存 seen 记录失败');
  }
}

// 扫描状态目录
async function scanStatusDir(config: ReturnType<typeof loadMasterConfig>): Promise<void> {
  if (!fs.existsSync(config.statusDir)) {
    fs.mkdirSync(config.statusDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(config.statusDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(config.statusDir, file);
    await processStatusFile(filePath, config, seenTasks, saveSeenTasks, logger);
  }
}

// 启动守护进程
export async function startDaemon(foreground = false): Promise<void> {
  const config = loadMasterConfig();

  logger.info('Task Master 启动');
  logger.info({ statusDir: config.statusDir }, '监控目录');

  // 初始化目录
  if (!fs.existsSync(config.statusDir)) {
    fs.mkdirSync(config.statusDir, { recursive: true });
  }

  // 加载去重记录
  loadSeenTasks();

  // 初始扫描
  await scanStatusDir(config);

  // 设置文件监听
  const watcher = chokidar.watch(path.join(config.statusDir, '*.json'), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', (filePath) => {
      logger.debug({ file: path.basename(filePath) }, '检测到新文件');
      processStatusFile(filePath, config, seenTasks, saveSeenTasks, logger).catch((err) => {
        logger.error({ err, file: filePath }, '处理文件失败');
      });
    })
    .on('change', (filePath) => {
      logger.debug({ file: path.basename(filePath) }, '检测到文件变更');
      processStatusFile(filePath, config, seenTasks, saveSeenTasks, logger).catch((err) => {
        logger.error({ err, file: filePath }, '处理文件失败');
      });
    })
    .on('error', (error) => {
      logger.error({ err: error }, 'Watcher 错误');
    });

  // 定时轮询兜底（30秒）
  const pollTimer = setInterval(async () => {
    await scanStatusDir(config);
  }, 30000);

  // 如果不是前台模式，fork 子进程
  if (!foreground) {
    const { fork } = await import('node:child_process');
    const child = fork(process.argv[1], ['--foreground'], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // 重定向输出到日志文件
    const logDir = path.join(process.env.HOME || '', '.task-master');
    fs.mkdirSync(logDir, { recursive: true });

    const stdout = fs.createWriteStream(path.join(logDir, 'stdout.log'), { flags: 'a' });
    const stderr = fs.createWriteStream(path.join(logDir, 'stderr.log'), { flags: 'a' });

    child.stdout?.pipe(stdout);
    child.stderr?.pipe(stderr);

    child.unref();
    logger.info('守护进程已在后台启动');
    return;
  }

  // 优雅退出
  process.on('SIGTERM', () => {
    logger.info('收到 SIGTERM，正在关闭...');
    watcher.close();
    clearInterval(pollTimer);
    saveSeenTasks();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('收到 SIGINT，正在关闭...');
    watcher.close();
    clearInterval(pollTimer);
    saveSeenTasks();
    process.exit(0);
  });

  logger.info('守护进程运行中...');
}
