import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import confirm from '@inquirer/confirm';
import input from '@inquirer/input';
import number from '@inquirer/number';
import { AGENT_CONFIG_DIR, AGENT_CONFIG_FILE, saveAgentConfig } from '@task/shared';
import type { Logger } from 'pino';

export async function initCommand(logger: Logger): Promise<void> {
  console.log('🔔 Claude Code Hook Notify - Agent 初始化\n');

  const hostname = os.hostname().split('.')[0];

  const agentName = await input({
    message: 'Agent 名称 (如: gpu-01):',
    default: hostname,
  });

  const masterHost = await input({
    message: 'Master 主机 (Mac 的 IP 或 hostname):',
    validate: (v: string) => v.trim().length > 0 || '请输入主机地址',
  });

  const masterUser = await input({
    message: 'Master 用户名:',
    default: os.userInfo().username,
    validate: (v: string) => v.trim().length > 0 || '请输入用户名',
  });

  const minDuration =
    (await number({
      message: '最小任务时长 (秒，低于此值不通知):',
      default: 300,
    })) || 300;

  const enableNotification = await confirm({
    message: '启用通知?',
    default: true,
  });

  const config = {
    agentName,
    master: {
      host: masterHost,
      user: masterUser,
      statusPath: '~/.task-status',
    },
    behavior: {
      minTaskDuration: minDuration,
      enableNotification,
    },
  };

  // 创建目录
  await fs.promises.mkdir(AGENT_CONFIG_DIR, { recursive: true });

  // 保存配置
  saveAgentConfig(config, AGENT_CONFIG_FILE);

  logger.info(`✅ 配置已写入 ${AGENT_CONFIG_FILE}`);

  // 创建 Hooks
  await installHooks();

  console.log('\n⚠️  下一步：配置 SSH 免密登录');
  console.log(`   ssh-copy-id ${masterUser}@${masterHost}`);
}

async function installHooks(): Promise<void> {
  const hooksDir = path.join(os.homedir(), '.claude', 'hooks');
  await fs.promises.mkdir(hooksDir, { recursive: true });

  const stopHook = `#!/bin/bash
# Claude Code Stop Hook
~/.task-agent/agent.js hook:stop --cwd "$PWD" || true
`;

  const preAskHook = `#!/bin/bash
# Claude Code PreAskUserQuestion Hook
~/.task-agent/agent.js hook:pre-ask || true
`;

  const postAskHook = `#!/bin/bash
# Claude Code PostAskUserQuestion Hook
~/.task-agent/agent.js hook:post-ask || true
`;

  await fs.promises.writeFile(path.join(hooksDir, 'stop.sh'), stopHook, { mode: 0o755 });
  await fs.promises.writeFile(path.join(hooksDir, 'pre-askuserquestion.sh'), preAskHook, {
    mode: 0o755,
  });
  await fs.promises.writeFile(path.join(hooksDir, 'post-askuserquestion.sh'), postAskHook, {
    mode: 0o755,
  });

  console.log('✅ Hooks 已安装到 ~/.claude/hooks/');
}
