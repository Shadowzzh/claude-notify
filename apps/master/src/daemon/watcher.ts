import chokidar from 'chokidar';
import type { Logger } from 'pino';

export function setupWatcher(
  statusDir: string,
  processor: (filePath: string) => Promise<void>,
  logger: Logger
): chokidar.FSWatcher {
  const watcher = chokidar.watch(statusDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', async (filePath) => {
      if (!filePath.endsWith('.json') || path.basename(filePath).startsWith('.')) {
        return;
      }
      logger.debug({ file: filePath }, '检测到新文件');
      await processor(filePath);
    })
    .on('change', async (filePath) => {
      if (!filePath.endsWith('.json') || path.basename(filePath).startsWith('.')) {
        return;
      }
      logger.debug({ file: filePath }, '检测到文件变更');
      await processor(filePath);
    })
    .on('error', (error) => {
      logger.error({ err: error }, 'Watcher 错误');
    });

  return watcher;
}

import path from 'node:path';
