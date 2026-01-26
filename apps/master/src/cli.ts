#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cac from 'cac';
import { startDaemon } from './daemon.js';
import { installService } from './install-service.js';
import { uninstallService } from './uninstall-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

const cli = cac('task-master');

cli
  .version(version)
  .help()
  .command('start', '启动守护进程')
  .option('--foreground', '前台运行（不作为守护进程）')
  .action(async (options) => {
    try {
      await startDaemon(options.foreground);
    } catch (error) {
      console.error('启动失败:', error);
      process.exit(1);
    }
  });

cli.command('stop', '停止守护进程').action(async () => {
  try {
    await stopDaemon();
  } catch (error) {
    console.error('停止失败:', error);
    process.exit(1);
  }
});

cli.command('install-service', '安装为系统服务 (LaunchAgent)').action(async () => {
  try {
    await installService();
  } catch (error) {
    console.error('安装失败:', error);
    process.exit(1);
  }
});

cli.command('uninstall-service', '卸载系统服务').action(async () => {
  try {
    await uninstallService();
  } catch (error) {
    console.error('卸载失败:', error);
    process.exit(1);
  }
});

cli.command('status', '查看服务状态').action(async () => {
  try {
    await showStatus();
  } catch (error) {
    console.error('查看状态失败:', error);
    process.exit(1);
  }
});

cli.parse();

async function stopDaemon() {
  const { execSync } = await import('node:child_process');
  try {
    execSync('launchctl unload ~/Library/LaunchAgents/com.task-master.plist', {
      stdio: 'inherit',
    });
    console.log('守护进程已停止');
  } catch (error) {
    console.log('ℹ️服务未运行或已停止');
  }
}

async function showStatus() {
  const { execSync } = await import('node:child_process');
  try {
    const output = execSync('launchctl list | grep task-master', { encoding: 'utf-8' });
    console.log('守护进程正在运行');
    console.log(output);
  } catch (error) {
    console.log('守护进程未运行');
  }
}
