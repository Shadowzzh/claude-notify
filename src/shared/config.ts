import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'smol-toml';
import { z } from 'zod';
import { AgentConfigSchema } from './schemas.js';
import type { AgentConfig, AgentState, HookContext, MasterMainConfig } from './types.js';

/**
 * 默认配置路径
 */
export const AGENT_CONFIG_DIR = path.join(os.homedir(), '.task-agent');
export const AGENT_CONFIG_FILE = path.join(AGENT_CONFIG_DIR, 'config.toml');
export const AGENT_STATE_FILE = path.join(AGENT_CONFIG_DIR, 'state.json');
export const AGENT_ENV_FILE = path.join(AGENT_CONFIG_DIR, '.env.local');

/**
 * Master 配置路径
 */
export const MASTER_CONFIG_DIR = path.join(os.homedir(), '.task-master');
export const MASTER_CONFIG_FILE = path.join(MASTER_CONFIG_DIR, 'config.toml');
export const MASTER_SEEN_FILE = path.join(MASTER_CONFIG_DIR, 'seen.json');
export const MASTER_STATUS_DIR = path.join(os.homedir(), '.task-status');

/**
 * 展开路径中的 ~
 */
function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

/**
 * 加载 Agent 配置
 */
export function loadAgentConfig(configPath = AGENT_CONFIG_FILE): AgentConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`配置文件不存在: ${configPath}\n请运行 "agent init" 初始化配置`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const raw = parse(content) as any;

  // 展开 ~ 路径
  if (raw.master?.status_path) {
    raw.master.status_path = expandPath(raw.master.status_path as string);
  }

  return AgentConfigSchema.parse(raw);
}

/**
 * 保存 Agent 配置
 */
export function saveAgentConfig(config: AgentConfig, configPath = AGENT_CONFIG_FILE): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  const toml = `
agent_name = "${config.agentName}"

[master]
host = "${config.master.host}"
user = "${config.master.user}"
status_path = "~/.task-status"${config.master.port ? `\nport = ${config.master.port}` : ''}

[behavior]
min_task_duration = ${config.behavior.minTaskDuration}
enable_notification = ${config.behavior.enableNotification ? 'true' : 'false'}
`.trim();

  fs.writeFileSync(configPath, toml);
}

/**
 * 加载/初始化 Agent 状态
 */
export function loadAgentState(statePath = AGENT_STATE_FILE): AgentState {
  if (!fs.existsSync(statePath)) {
    const defaultState: AgentState = {
      lastStopTime: 0,
      isWaitingForUser: false,
      currentTaskId: '',
      sessionStart: Date.now(),
    };
    saveAgentState(defaultState, statePath);
    return defaultState;
  }

  const content = fs.readFileSync(statePath, 'utf-8');
  return JSON.parse(content) as AgentState;
}

/**
 * 保存 Agent 状态
 */
export function saveAgentState(state: AgentState, statePath = AGENT_STATE_FILE): void {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

/**
 * 加载 Master 配置
 */
export function loadMasterConfig(configPath = MASTER_CONFIG_FILE): MasterMainConfig {
  if (!fs.existsSync(configPath)) {
    // 默认配置
    return {
      statusDir: MASTER_STATUS_DIR,
      scanInterval: 10000,
      notificationSound: 'Glass',
      enableSound: true,
      notificationStyle: 'banner',
      notificationTimeout: 5,
      autoStyle: true,
      longTaskThreshold: 300,
    };
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const raw = parse(content) as any;

  // 展开 status_dir 中的波浪号
  const rawStatusDir = raw.status_dir ?? MASTER_STATUS_DIR;
  const statusDir = typeof rawStatusDir === 'string' ? expandPath(rawStatusDir) : rawStatusDir;

  const config: MasterMainConfig = {
    statusDir,
    scanInterval: raw.scan_interval ?? 10000,
    notificationSound: raw.notification_sound ?? 'Glass',
    enableSound: raw.enable_sound ?? true,
    notificationStyle: raw.notification_style ?? 'banner',
    notificationTimeout: raw.notification_timeout ?? 5,
    autoStyle: raw.auto_style ?? true,
    longTaskThreshold: raw.long_task_threshold ?? 300,
  };

  // 加载 statusPrefix 配置
  if (raw.status_prefix) {
    config.statusPrefix = {
      completed: raw.status_prefix.completed,
      waiting: raw.status_prefix.waiting,
      error: raw.status_prefix.error,
      default: raw.status_prefix.default,
    };
  }

  return config;
}

/**
 * 生成 UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 解析 Hook 上下文（从环境变量）
 */
export function parseHookContext(): HookContext {
  return {
    cwd: process.cwd(),
    sessionId: process.env.CLAUDE_SESSION_ID,
    toolName: process.env.CLAUDE_TOOL_NAME,
  };
}
