import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cac from 'cac';
import { pino } from 'pino';
import { initCommand } from './commands/init.js';
import { postAskCommand } from './commands/post-ask.js';
import { preAskCommand } from './commands/pre-ask.js';
import { pushCommand } from './commands/push.js';
import { statusCommand } from './commands/status.js';
import { stopCommand } from './commands/stop.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const cli = cac('agent');

cli
  .version(version)
  .help()
  .command('init', '交互式初始化配置')
  .action(async () => {
    try {
      await initCommand(logger);
    } catch (error) {
      logger.error({ error }, '初始化失败');
      process.exit(1);
    }
  });

cli
  .command('hook:stop', '处理 Stop Hook')
  .option('--cwd <path>', '当前工作目录')
  .action(async (options) => {
    try {
      await stopCommand({ cwd: options.cwd || process.cwd() }, logger);
    } catch (error) {
      logger.error({ error }, 'Stop Hook 处理失败');
      process.exit(0); // Hook 失败不应中断
    }
  });

cli.command('hook:pre-ask', '处理 PreAskUserQuestion Hook').action(async () => {
  try {
    await preAskCommand(logger);
  } catch (error) {
    logger.error({ error }, 'Pre-Ask Hook 处理失败');
    process.exit(0);
  }
});

cli.command('hook:post-ask', '处理 PostAskUserQuestion Hook').action(async () => {
  try {
    await postAskCommand(logger);
  } catch (error) {
    logger.error({ error }, 'Post-Ask Hook 处理失败');
    process.exit(0);
  }
});

cli
  .command('push <status>', '手动推送状态')
  .option('--message <msg>', '通知消息')
  .option('--duration <seconds>', '任务时长', { default: '0' })
  .action(async (status, options) => {
    try {
      await pushCommand(status, options.message, Number(options.duration), logger);
    } catch (error) {
      logger.error({ error }, '推送失败');
      process.exit(1);
    }
  });

cli.command('status', '查看当前状态').action(async () => {
  try {
    await statusCommand(logger);
  } catch (error) {
    logger.error({ error }, '查看状态失败');
    process.exit(1);
  }
});

cli.parse();
