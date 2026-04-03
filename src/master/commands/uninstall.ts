import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LAUNCH_AGENTS_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');
const PLIST_FILE = path.join(LAUNCH_AGENTS_DIR, 'com.task-master.plist');

export async function uninstallService(): Promise<void> {
  // 卸载服务
  try {
    execSync(`launchctl unload ${PLIST_FILE}`, { stdio: 'inherit' });
    console.log('✅ 服务已停止');
  } catch (error) {
    console.log('ℹ️  服务未运行');
  }

  // 删除 plist 文件
  if (fs.existsSync(PLIST_FILE)) {
    await fs.promises.unlink(PLIST_FILE);
    console.log('✅ plist 文件已删除');
  }

  console.log('\n提示: 如需清理配置文件，请手动删除 ~/.task-master 目录');
}
