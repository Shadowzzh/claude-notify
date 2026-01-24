import type { AgentConfig, TaskStatusPayload } from '@task/shared';
import pRetry from 'p-retry';
import { Client } from 'ssh2';

export async function pushToMaster(config: AgentConfig, payload: TaskStatusPayload): Promise<void> {
  const content = JSON.stringify(payload, null, 2);
  const remotePath = `${config.master.statusPath}/${config.agentName}.json`;

  await pRetry(
    () => {
      return new Promise<void>((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', () => {
          conn.sftp((err, sftp) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            sftp.writeFile(remotePath, content, (err) => {
              conn.end();
              if (err) {
                return reject(err);
              }
              resolve();
            });
          });
        });

        conn.on('error', (err) => {
          reject(err);
        });

        // 连接配置 - 使用系统 SSH 配置
        conn.connect({
          host: config.master.host,
          username: config.master.user,
          port: config.master.port || 22,
          // 使用系统默认的 SSH 密钥和配置
          prepareCommand: `mkdir -p ${config.master.statusPath}`,
        });
      });
    },
    {
      retries: 3,
      maxTimeout: 5000,
      onFailedAttempt: (error) => {
        console.warn(`推送失败，第 ${error.attemptNumber} 次尝试...`);
      },
    }
  );
}
