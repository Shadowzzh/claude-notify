import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { MASTER_STATUS_DIR, loadMasterConfig } from '@task/shared';
import { pino } from 'pino';
import { startPolling } from './polling.js';
import { setupWatcher } from './watcher.js';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// 状态目录
let statusDir = MASTER_STATUS_DIR;

// 去重记录
const seenTasks = new Map<string, Set<string>>();

async function main() {
  const config = loadMasterConfig();
  statusDir = config.statusDir;

  logger.info('🔔 Task Master 启动');
  logger.info({ statusDir }, '监控目录');

  // 初始化目录
  await mkdir(statusDir, { recursive: true });

  // 加载去重记录
  await loadSeenTasks();

  // 初始扫描
  await scanStatusDir();

  // 启动文件监听
  const watcher = setupWatcher(statusDir, handleStatusFile, logger);

  // 启动轮询兜底
  const pollTimer = startPolling(scanStatusDir, 30000);

  // 优雅退出
  const shutdown = () => {
    watcher.close();
    clearInterval(pollTimer);
    logger.info('Task Master 已停止');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function loadSeenTasks() {
  const seenPath = path.join(statusDir, '.seen.json');
  try {
    if (fs.existsSync(seenPath)) {
      const content = await fs.promises.readFile(seenPath, 'utf-8');
      const data = JSON.parse(content);
      for (const [agent, tasks] of Object.entries(data)) {
        seenTasks.set(agent, new Set(tasks as string[]));
      }
    }
  } catch {
    // 忽略错误
  }
}

async function saveSeenTasks() {
  const seenPath = path.join(statusDir, '.seen.json');
  const data: Record<string, string[]> = {};
  for (const [agent, tasks] of seenTasks.entries()) {
    data[agent] = Array.from(tasks);
  }
  await fs.promises.writeFile(seenPath, JSON.stringify(data, null, 2));
}

async function scanStatusDir() {
  const files = await fs.promises.readdir(statusDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.startsWith('.'));
  for (const file of jsonFiles) {
    await handleStatusFile(path.join(statusDir, file));
  }
}

async function handleStatusFile(filePath: string) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const status = JSON.parse(content) as {
      agentName: string;
      taskId: string;
      status: string;
      message: string;
      duration: number;
    };

    if (!status.agentName || !status.taskId) {
      return;
    }

    // 检查是否已处理
    if (!seenTasks.has(status.agentName)) {
      seenTasks.set(status.agentName, new Set());
    }
    const agentSeen = seenTasks.get(status.agentName)!;
    if (agentSeen.has(status.taskId)) {
      return;
    }

    // 发送通知
    await sendNotification(status);

    // 记录已处理
    agentSeen.add(status.taskId);
    await saveSeenTasks();

    logger.info(
      { agent: status.agentName, taskId: status.taskId, status: status.status },
      '通知已发送'
    );
  } catch (err) {
    logger.error({ err, filePath }, '处理文件失败');
  }
}

async function sendNotification(status: {
  agentName: string;
  status: string;
  message: string;
  duration: number;
}) {
  const title =
    status.status === 'completed'
      ? `🔔 ${status.agentName} 任务完成`
      : `⚠️ ${status.agentName} 需要决策`;

  const subtitle = formatDuration(status.duration);

  // 转义消息中的特殊字符
  const safeMessage = status.message.replace(/"/g, '\\"').replace(/'/g, "\\'");

  const script = `display notification "${safeMessage}" with title "${title}" subtitle "${subtitle}" sound name "Glass"`;

  // 使用 child_process 执行 osascript
  const { exec } = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    exec(`osascript -e '${script}'`, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}小时${m}分钟`;
}

main().catch((err) => {
  logger.error({ err }, '启动失败');
  process.exit(1);
});
