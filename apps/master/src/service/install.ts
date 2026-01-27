import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LAUNCH_AGENTS_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');
const PLIST_FILE = path.join(LAUNCH_AGENTS_DIR, 'com.task-master.plist');
const CONFIG_DIR = path.join(os.homedir(), '.task-master');

export async function installService(): Promise<void> {
  // 确保目录存在
  await fs.promises.mkdir(LAUNCH_AGENTS_DIR, { recursive: true });

  // 获取可执行文件路径
  const executablePath = process.execPath;

  // 创建 plist 文件
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.task-master</string>

    <key>ProgramArguments</key>
    <array>
        <string>${executablePath}</string>
        <string>${path.join(CONFIG_DIR, 'cli.js')}</string>
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
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
`;

  await fs.promises.writeFile(PLIST_FILE, plistContent, { mode: 0o644 });

  console.log(`✅ plist 文件已创建: ${PLIST_FILE}`);

  // 加载服务
  try {
    execSync(`launchctl load ${PLIST_FILE}`, { stdio: 'inherit' });
    console.log('✅ 服务已启动');
  } catch (error) {
    console.warn('⚠️  服务加载可能失败，请检查: launchctl list | grep task-master');
  }
}
