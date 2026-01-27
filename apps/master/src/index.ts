import { pino } from 'pino';
import { runDaemonCore } from './daemon/core';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

async function main() {
  await runDaemonCore(logger);
}

main().catch((err) => {
  logger.error({ err }, '启动失败');
  process.exit(1);
});
