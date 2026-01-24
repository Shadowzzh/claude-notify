import { loadAgentConfig, loadAgentState } from '@task/shared';
import type { Logger } from 'pino';

export async function statusCommand(logger: Logger): Promise<void> {
  try {
    const config = loadAgentConfig();
    const state = loadAgentState();

    console.log('\n=== Agent 状态 ===\n');
    console.log('配置文件: ~/.task-agent/config.toml');
    console.log(`\nAgent 名称: ${config.agentName}`);
    console.log(`Master: ${config.master.user}@${config.master.host}`);
    console.log(`状态目录: ${config.master.statusPath}`);
    console.log(`\n最小时长: ${config.behavior.minTaskDuration}秒`);
    console.log(`通知启用: ${config.behavior.enableNotification ? '是' : '否'}`);

    console.log('\n--- 运行状态 ---\n');
    console.log(`上次 Stop: ${new Date(state.lastStopTime).toLocaleString()}`);
    console.log(`等待用户: ${state.isWaitingForUser ? '是' : '否'}`);
    console.log(`当前任务: ${state.currentTaskId || '(无)'}`);
    console.log(`会话开始: ${new Date(state.sessionStart).toLocaleString()}`);
    console.log('');
  } catch (error) {
    if ((error as Error).message.includes('配置文件不存在')) {
      console.log('\n❌ 未找到配置文件');
      console.log('请先运行: agent init\n');
    } else {
      throw error;
    }
  }
}
