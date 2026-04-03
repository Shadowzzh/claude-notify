import type { Logger } from 'pino';
import { generateUUID, loadAgentConfig } from '../../shared/index.js';
import { pushToMaster } from '../ssh.js';

export async function pushCommand(
  status: string,
  message: string,
  duration: number,
  logger: Logger
): Promise<void> {
  const config = loadAgentConfig();
  const taskId = generateUUID();

  await pushToMaster(config, {
    agentName: config.agentName,
    taskId,
    status: status as any,
    message: message || `测试推送: ${status}`,
    timestamp: Date.now(),
    duration,
    workingDir: process.cwd(),
  });

  logger.info({ taskId, status }, '状态已推送');
}
