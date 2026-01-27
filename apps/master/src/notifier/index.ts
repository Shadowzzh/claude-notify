import { execSync } from 'node:child_process';
import type { MasterMainConfig, TaskStatusPayload } from '@task/shared';

export async function sendNotification(
  status: TaskStatusPayload,
  config: MasterMainConfig
): Promise<void> {
  const title = generateTitle(status, config.statusPrefix);
  const subtitle = formatDuration(status.duration);
  const body = status.message || '无详细信息';

  // 转义特殊字符 (先转义反斜杠,再转义引号)
  const escapedBody = escapeForAppleScript(body);
  const escapedTitle = escapeForAppleScript(title);
  const escapedSubtitle = escapeForAppleScript(subtitle);

  const script = `display notification "${escapedBody}" with title "${escapedTitle}" subtitle "${escapedSubtitle}"${config.enableSound ? ` sound name "${config.notificationSound}"` : ''}`;

  try {
    execSync(`osascript -e '${script}'`);
  } catch (error) {
    console.error('发送 macOS 通知失败:', error);
  }
}

function generateTitle(
  status: TaskStatusPayload,
  customPrefix?: { completed?: string; waiting?: string; error?: string; default?: string }
): string {
  const defaultPrefix = {
    completed: '[完成]',
    waiting: '[等待]',
    error: '[错误]',
  };

  const statusPrefix = {
    completed: customPrefix?.completed ?? defaultPrefix.completed,
    waiting: customPrefix?.waiting ?? defaultPrefix.waiting,
    error: customPrefix?.error ?? defaultPrefix.error,
  };

  const prefix = statusPrefix[status.status] || customPrefix?.default || '[状态]';

  return `${prefix} ${status.agentName}`;
}

function escapeForAppleScript(str: string): string {
  // 先转义反斜杠,再转义双引号
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}
