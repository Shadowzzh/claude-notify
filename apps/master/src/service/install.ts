import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LAUNCH_AGENTS_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');
const PLIST_FILE = path.join(LAUNCH_AGENTS_DIR, 'com.task-master.plist');
const CONFIG_DIR = path.join(os.homedir(), '.task-master');

export async function installService(): Promise<void> {
  // 检查 alerter 是否安装
  checkAlerter();

  // 确保目录存在
  await fs.promises.mkdir(LAUNCH_AGENTS_DIR, { recursive: true });

  // 获取 task-master 命令的实际路径
  let taskMasterPath: string;
  try {
    taskMasterPath = execSync('which task-master', { encoding: 'utf-8' }).trim();
  } catch {
    console.error('[错误] 未找到 task-master 命令');
    console.error('[提示] 请先运行: pnpm link --global');
    process.exit(1);
  }

  // 创建 plist 文件
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.task-master</string>

    <key>ProgramArguments</key>
    <array>
        <string>${taskMasterPath}</string>
        <string>start</string>
        <string>--foreground</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>WorkingDirectory</key>
    <string>${CONFIG_DIR}</string>

    <key>StandardOutPath</key>
    <string>${path.join(CONFIG_DIR, 'stdout.log')}</string>

    <key>StandardErrorPath</key>
    <string>${path.join(CONFIG_DIR, 'stderr.log')}</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin</string>
    </dict>
</dict>
</plist>
`;

  await fs.promises.writeFile(PLIST_FILE, plistContent, { mode: 0o644 });

  console.log(`[成功] plist 文件已创建: ${PLIST_FILE}`);

  // 加载服务
  try {
    execSync(`launchctl load ${PLIST_FILE}`, { stdio: 'inherit' });
    console.log('[成功] 服务已启动');
  } catch (error) {
    console.warn('[警告] 服务加载可能失败，请检查: launchctl list | grep task-master');
  }
}

/**
 * 检查 alerter 是否安装
 */
function checkAlerter(): void {
  try {
    execSync('which alerter', { stdio: 'ignore' });
    console.log('[成功] alerter 已安装');
  } catch {
    console.log('\n[提示] 未检测到 alerter，将使用系统默认通知');
    console.log('[建议] 推荐安装 alerter 以获得更好的通知体验:');
    console.log('       brew install vjeantet/tap/alerter');
    console.log('\nalerter 提供以下增强功能:');
    console.log('  - 持久化通知（长任务不会自动消失）');
    console.log('  - 点击通知跳转到项目目录');
    console.log('  - 通知分组管理');
    console.log('  - 更灵活的超时控制\n');
  }
}

// 执行安装
installService().catch((error) => {
  console.error('[错误] 安装失败:', error);
  process.exit(1);
});
