import type { Logger } from 'pino';
import {
  generateUUID,
  loadAgentConfig,
  loadAgentState,
  saveAgentState,
} from '../../shared/index.js';
import { pushToMaster } from '../ssh.js';

export async function preAskCommand(logger: Logger): Promise<void> {
  const config = loadAgentConfig();
  if (!config.behavior.enableNotification) {
    return;
  }

  const state = loadAgentState();
  const taskId = generateUUID();

  // 标记等待用户
  await saveAgentState({
    ...state,
    isWaitingForUser: true,
    currentTaskId: taskId,
  });

  await pushToMaster(config, {
    agentName: config.agentName,
    taskId,
    status: 'waiting',
    message: '需要您做出决策',
    timestamp: Date.now(),
    duration: 0,
    workingDir: process.cwd(),
  });

  logger.info({ taskId }, '等待用户决策通知已推送');
}
