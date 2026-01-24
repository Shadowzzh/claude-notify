import { describe, expect, it } from 'vitest';
import { AgentConfigSchema, TaskStatusPayloadSchema } from './schemas.js';

describe('schemas', () => {
  describe('AgentConfigSchema', () => {
    it('should validate valid config', () => {
      const validConfig = {
        agentName: 'gpu-01',
        master: {
          host: 'mac.local',
          user: 'zzh',
          statusPath: '~/.task-status',
          port: 22,
        },
        behavior: {
          minTaskDuration: 300,
          enableNotification: true,
        },
      };

      expect(() => AgentConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should reject config without agentName', () => {
      const invalidConfig = {
        agentName: '',
        master: {
          host: 'mac.local',
          user: 'zzh',
          statusPath: '~/.task-status',
        },
        behavior: {
          minTaskDuration: 300,
          enableNotification: true,
        },
      };

      expect(() => AgentConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with negative duration', () => {
      const invalidConfig = {
        agentName: 'gpu-01',
        master: {
          host: 'mac.local',
          user: 'zzh',
          statusPath: '~/.task-status',
        },
        behavior: {
          minTaskDuration: -100,
          enableNotification: true,
        },
      };

      expect(() => AgentConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('TaskStatusPayloadSchema', () => {
    it('should validate valid payload', () => {
      const validPayload = {
        agentName: 'gpu-01',
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'completed',
        message: '任务完成',
        timestamp: Date.now(),
        duration: 3600,
        workingDir: '/home/user/project',
      };

      expect(() => TaskStatusPayloadSchema.parse(validPayload)).not.toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalidPayload = {
        agentName: 'gpu-01',
        taskId: 'not-a-uuid',
        status: 'completed',
        message: '任务完成',
        timestamp: Date.now(),
        duration: 3600,
        workingDir: '/home/user/project',
      };

      expect(() => TaskStatusPayloadSchema.parse(invalidPayload)).toThrow();
    });

    it('should reject invalid status', () => {
      const invalidPayload = {
        agentName: 'gpu-01',
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'invalid',
        message: '任务完成',
        timestamp: Date.now(),
        duration: 3600,
        workingDir: '/home/user/project',
      };

      expect(() => TaskStatusPayloadSchema.parse(invalidPayload)).toThrow();
    });
  });
});
