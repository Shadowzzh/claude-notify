import { execSync } from 'node:child_process';
import fs from 'node:fs';
import type { TaskStatusPayload } from '@task/shared';
import lockfile from 'proper-lockfile';
import { sendNotification } from './notifier/index.js';

interface SeenTasks {
  get(agentName: string): Set<string> | undefined;
  set(agentName: string, tasks: Set<string>): void;
  has(agentName: string): boolean;
}

export async function processStatusFile(
  filePath: string,
  config: { statusDir: string; notificationSound: string; enableSound: boolean },
  seenTasks: SeenTasks,
  saveSeenTasks: () => void,
  logger: any
): Promise<void> {
  // 文件锁防止并发读取
  const release = await lockfile.lock(filePath, { retries: 0 }).catch(() => null);

  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const status: TaskStatusPayload = JSON.parse(content);

    // 检查是否已处理
    if (!seenTasks.has(status.agentName)) {
      seenTasks.set(status.agentName, new Set());
    }

    const agentSeen = seenTasks.get(status.agentName)!;
    if (agentSeen.has(status.taskId)) {
      logger.debug({ agent: status.agentName, taskId: status.taskId }, '任务已处理，跳过');
      return;
    }

    // 发送通知
    await sendNotification(status, config);

    // 记录已处理
    agentSeen.add(status.taskId);

    // 限制每个 agent 最多保存 100 条记录
    if (agentSeen.size > 100) {
      const oldest = Array.from(agentSeen)[0];
      if (oldest) {
        agentSeen.delete(oldest);
      }
    }

    saveSeenTasks();

    logger.info(
      { agent: status.agentName, taskId: status.taskId, status: status.status },
      '通知已发送'
    );
  } catch (err) {
    logger.error({ err, filePath }, '处理文件失败');
  } finally {
    await release?.();
  }
}
