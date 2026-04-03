import type { Logger } from 'pino';
import { loadAgentState, saveAgentState } from '../../shared/index.js';

export async function postAskCommand(logger: Logger): Promise<void> {
  const state = loadAgentState();

  // 清除等待标记
  await saveAgentState({
    ...state,
    isWaitingForUser: false,
  });

  logger.debug('用户已回答，清除等待标记');
}
