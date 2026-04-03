import { generateUUID, loadAgentConfig, loadAgentState, saveAgentState } from '../../shared/index.js';
import type { Logger } from 'pino';
import { pushToMaster } from '../ssh.js';

interface StopOptions {
  cwd: string;
}

export async function stopCommand(options: StopOptions, logger: Logger): Promise<void> {
  const config = loadAgentConfig();
  if (!config.behavior.enableNotification) {
    return;
  }

  const state = loadAgentState();
  const now = Date.now();
  const timeDiff = Math.floor((now - state.lastStopTime) / 1000);

  // 判断是否需要通知
  const shouldNotify = !state.isWaitingForUser && timeDiff >= config.behavior.minTaskDuration;

  // 更新状态
  await saveAgentState({
    ...state,
    lastStopTime: now,
    isWaitingForUser: false,
  });

  if (shouldNotify) {
    const taskId = generateUUID();
    await saveAgentState({ ...state, currentTaskId: taskId });

    await pushToMaster(config, {
      agentName: config.agentName,
      taskId,
      status: 'completed',
      message: `任务完成 (耗时: ${formatDuration(timeDiff)})`,
      timestamp: now,
      duration: timeDiff,
      workingDir: options.cwd,
    });

    logger.info({ taskId, duration: timeDiff }, '任务完成通知已推送');
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}小时${m}分钟`;
}
