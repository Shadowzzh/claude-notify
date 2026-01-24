import { execSync } from 'node:child_process';
import type { TaskStatusPayload } from '@task/shared';

export async function sendNotification(
  status: TaskStatusPayload,
  config: { notificationSound: string; enableSound: boolean }
): Promise<void> {
  const title =
    status.status === 'completed'
      ? `🔔 ${status.agentName} 任务完成`
      : status.status === 'waiting'
        ? `⚠️ ${status.agentName} 需要决策`
        : `❌ ${status.agentName} 出错`;

  const subtitle = formatDuration(status.duration);
  const body = status.message || '无详细信息';

  // 转义特殊字符
  const escapedBody = body.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  const escapedTitle = title.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  const escapedSubtitle = subtitle.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

  const script = `display notification "${escapedBody}" with title "${escapedTitle}" subtitle "${escapedSubtitle}"${config.enableSound ? ` sound name "${config.notificationSound}"` : ''}`;

  try {
    execSync(`osascript -e '${script}'`);
  } catch (error) {
    console.error('发送 macOS 通知失败:', error);
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}小时${m}分钟`;
}
