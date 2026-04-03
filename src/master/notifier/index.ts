import { execSync } from 'node:child_process';
import type { MasterMainConfig, TaskStatusPayload } from '../../shared/index.js';

/**
 * 检查 alerter 是否可用
 */
function isAlerterAvailable(): boolean {
  try {
    execSync('which alerter', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 使用 alerter 发送通知
 */
function sendAlerterNotification(status: TaskStatusPayload, config: MasterMainConfig): void {
  const title = generateTitle(status, config.statusPrefix);
  const subtitle = `Agent: ${status.agentName}`;
  const message = status.message || formatDuration(status.duration);

  // 决定通知样式
  const style =
    config.autoStyle && status.duration > config.longTaskThreshold
      ? 'alert'
      : config.notificationStyle;

  const args: string[] = [
    '--title',
    escapeShellArg(title),
    '--subtitle',
    escapeShellArg(subtitle),
    '--message',
    escapeShellArg(message),
    '--group',
    'claude-code-tasks',
  ];

  // 添加声音
  if (config.enableSound) {
    args.push('--sound', config.notificationSound);
  }

  // 添加样式
  if (style === 'alert') {
    // alert 样式不需要超时
  } else {
    // banner 样式，添加超时
    args.push('--timeout', config.notificationTimeout.toString());
  }

  const command = `alerter ${args.join(' ')}`;

  try {
    execSync(command, { stdio: 'ignore' });
  } catch (error) {
    console.error('发送 alerter 通知失败:', error);
  }
}

/**
 * 使用 osascript 发送通知（降级方案）
 */
function sendOsascriptNotification(status: TaskStatusPayload, config: MasterMainConfig): void {
  const title = generateTitle(status, config.statusPrefix);
  const subtitle = formatDuration(status.duration);
  const body = status.message || '无详细信息';

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

/**
 * 发送任务完成通知
 */
export async function sendNotification(
  status: TaskStatusPayload,
  config: MasterMainConfig
): Promise<void> {
  const useAlerter = isAlerterAvailable();

  if (useAlerter) {
    sendAlerterNotification(status, config);
  } else {
    sendOsascriptNotification(status, config);
  }
}

/**
 * 生成通知标题
 */
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

/**
 * 转义 AppleScript 字符串
 */
function escapeForAppleScript(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 转义 shell 参数
 */
function escapeShellArg(str: string): string {
  return `"${str.replace(/"/g, '\\"')}"`;
}

/**
 * 格式化时长
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}
