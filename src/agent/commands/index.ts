import type { Command } from 'commander';
import { initCommand } from './init.js';
import { postAskCommand } from './post-ask.js';
import { preAskCommand } from './pre-ask.js';
import { pushCommand } from './push.js';
import { statusCommand } from './status.js';
import { stopCommand } from './stop.js';

export function agentCommands(program: Command) {
  program.command('init').description('初始化 Agent 配置').action(initCommand);

  program.command('status').description('查看 Agent 状态').action(statusCommand);

  program
    .command('push <status>')
    .description('手动推送状态')
    .option('-m, --message <message>', '任务消息')
    .option('-d, --duration <seconds>', '任务时长(秒)', Number.parseInt)
    .action(pushCommand);

  program
    .command('stop')
    .description('Hook: 任务停止')
    .option('--cwd <path>', '工作目录')
    .action(stopCommand);

  program.command('pre-ask').description('Hook: 提问前').action(preAskCommand);

  program.command('post-ask').description('Hook: 回答后').action(postAskCommand);
}
