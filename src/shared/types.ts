/**
 * 任务状态类型
 */
export type TaskStatus = 'completed' | 'waiting' | 'error';

/**
 * 任务状态枚举（用于常量引用）
 */
export const TaskStatus = {
  COMPLETED: 'completed' as const,
  WAITING: 'waiting' as const,
  ERROR: 'error' as const,
} as const;

/**
 * Agent 推送给 Master 的状态数据
 */
export interface TaskStatusPayload {
  agentName: string;
  taskId: string;
  status: TaskStatus;
  message: string;
  timestamp: number;
  duration: number;
  workingDir: string;
}

/**
 * Agent 本地持久化的状态
 */
export interface AgentState {
  lastStopTime: number;
  isWaitingForUser: boolean;
  currentTaskId: string;
  sessionStart: number;
}

/**
 * Agent 配置文件结构
 */
export interface AgentConfig {
  agentName: string;
  master: MasterConfig;
  behavior: BehaviorConfig;
}

export interface MasterConfig {
  host: string;
  user: string;
  statusPath: string;
  port?: number;
}

export interface BehaviorConfig {
  minTaskDuration: number;
  enableNotification: boolean;
}

/**
 * Master 侧配置
 */
export interface MasterMainConfig {
  statusDir: string;
  scanInterval: number;
  notificationSound: string;
  enableSound: boolean;
  statusPrefix?: StatusPrefixConfig;
  notificationStyle: 'banner' | 'alert';
  notificationTimeout: number;
  autoStyle: boolean;
  longTaskThreshold: number;
}

/**
 * 状态前缀配置
 */
export interface StatusPrefixConfig {
  completed?: string;
  waiting?: string;
  error?: string;
  default?: string;
}

/**
 * Hook 上下文
 */
export interface HookContext {
  cwd: string;
  sessionId?: string;
  toolName?: string;
}
