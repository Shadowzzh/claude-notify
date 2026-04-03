import { z } from 'zod';
import type {
  AgentConfig,
  BehaviorConfig,
  MasterConfig,
  MasterMainConfig,
  TaskStatusPayload,
} from './types.js';
import { TaskStatus } from './types.js';

export const MasterConfigSchema: z.ZodType<MasterConfig> = z.object({
  host: z.string().min(1),
  user: z.string().min(1),
  statusPath: z.string().min(1),
  port: z.number().int().positive().optional(),
});

export const BehaviorConfigSchema: z.ZodType<BehaviorConfig> = z.object({
  minTaskDuration: z.number().int().min(0),
  enableNotification: z.boolean(),
});

export const AgentConfigSchema: z.ZodType<AgentConfig> = z.object({
  agentName: z.string().min(1),
  master: MasterConfigSchema,
  behavior: BehaviorConfigSchema,
});

export const MasterMainConfigSchema: z.ZodType<MasterMainConfig> = z.object({
  statusDir: z.string(),
  scanInterval: z.number().int().positive(),
  notificationSound: z.string(),
  enableSound: z.boolean(),
  statusPrefix: z
    .object({
      completed: z.string().optional(),
      waiting: z.string().optional(),
      error: z.string().optional(),
      default: z.string().optional(),
    })
    .optional(),
  notificationStyle: z.enum(['banner', 'alert']),
  notificationTimeout: z.number().int().positive(),
  autoStyle: z.boolean(),
  longTaskThreshold: z.number().int().positive(),
});

export const TaskStatusPayloadSchema: z.ZodType<TaskStatusPayload> = z.object({
  agentName: z.string(),
  taskId: z.string().uuid(),
  status: z.enum([TaskStatus.COMPLETED, TaskStatus.WAITING, TaskStatus.ERROR]),
  message: z.string(),
  timestamp: z.number(),
  duration: z.number(),
  workingDir: z.string(),
});
