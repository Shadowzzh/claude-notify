import type { Command } from 'commander';
import { installService } from './install.js';
import { startCommand } from './start.js';
import { statusCommand } from './status.js';
import { stopCommand } from './stop.js';
import { uninstallService } from './uninstall.js';

export function masterCommands(program: Command) {
  program
    .command('start')
    .description('启动 Master 守护进程')
    .option('-f, --foreground', '前台运行')
    .action(startCommand);

  program.command('stop').description('停止 Master 守护进程').action(stopCommand);

  program.command('status').description('查看 Master 状态').action(statusCommand);

  program
    .command('install')
    .description('安装为系统服务 (macOS LaunchAgent)')
    .action(installService);

  program.command('uninstall').description('卸载系统服务').action(uninstallService);
}
