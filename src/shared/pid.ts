import fs from 'node:fs';
import path from 'node:path';

/**
 * PID 文件管理器
 * 用于管理守护进程的 PID 文件
 */
export class PidManager {
  constructor(private pidFile: string) {}

  /**
   * 写入 PID 到文件
   */
  write(pid: number): void {
    const dir = path.dirname(this.pidFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.pidFile, String(pid), 'utf-8');
  }

  /**
   * 从文件读取 PID
   */
  read(): number | null {
    try {
      if (!fs.existsSync(this.pidFile)) {
        return null;
      }
      const content = fs.readFileSync(this.pidFile, 'utf-8');
      const pid = Number.parseInt(content.trim(), 10);
      return Number.isNaN(pid) ? null : pid;
    } catch {
      return null;
    }
  }

  /**
   * 检查进程是否正在运行
   */
  isRunning(): boolean {
    const pid = this.read();
    if (!pid) {
      return false;
    }

    try {
      // 发送信号 0 检查进程是否存在
      // 如果进程存在，不会发送实际信号，只是检查权限
      process.kill(pid, 0);
      return true;
    } catch (error) {
      // 进程不存在，清理 PID 文件
      this.remove();
      return false;
    }
  }

  /**
   * 删除 PID 文件
   */
  remove(): void {
    try {
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }
    } catch {
      // 忽略删除失败
    }
  }

  /**
   * 获取 PID（如果进程正在运行）
   */
  getPid(): number | null {
    if (this.isRunning()) {
      return this.read();
    }
    return null;
  }

  /**
   * 获取 PID 文件路径
   */
  getFilePath(): string {
    return this.pidFile;
  }
}
