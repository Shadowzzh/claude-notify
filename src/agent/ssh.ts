import pRetry from 'p-retry';
import { Client } from 'ssh2';
import type { AgentConfig, TaskStatusPayload } from '../../shared/index.js';

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

            // 先创建目录
            sftp.mkdir(config.master.statusPath, { mode: 0o755 }, (mkdirErr: any) => {
              // 忽略目录已存在的错误
              if (mkdirErr && mkdirErr.code !== '4') {
                // 错误码 4 表示文件已存在
                conn.end();
                return reject(mkdirErr);
              }

              // 写入文件
              sftp.writeFile(remotePath, content, (writeErr) => {
                conn.end();
                if (writeErr) {
                  return reject(writeErr);
                }
                resolve();
              });
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
