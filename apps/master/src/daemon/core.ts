import fs from 'node:fs'
import path from 'node:path'
import { MASTER_SEEN_FILE, loadMasterConfig, type PidManager } from '@task/shared'
import type { Logger } from 'pino'
import { pino } from 'pino'
import { processStatusFile } from '../processor'
import { startPolling } from './polling'
import { setupWatcher } from './watcher'

/**
 * 守护进程核心逻辑
 */
export async function runDaemonCore(logger?: Logger, pidManager?: PidManager): Promise<void> {
  const pinoInstance = pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  })

  const log = logger || pinoInstance


  const config = loadMasterConfig()
  const seenTasks = new Map<string, Set<string>>()

  log.info('Task Master 启动')
  log.info({ statusDir: config.statusDir }, '监控目录')

  // 初始化目录
  if (!fs.existsSync(config.statusDir)) {
    fs.mkdirSync(config.statusDir, { recursive: true })
  }

  // 加载去重记录
  loadSeenTasks(seenTasks, log)

  // 保存去重记录的函数
  const saveSeenTasks = () => saveSeenTasksToFile(seenTasks, log)

  // 扫描状态目录的函数
  const scanStatusDir = async () => {
    if (!fs.existsSync(config.statusDir)) {
      fs.mkdirSync(config.statusDir, { recursive: true })
      return
    }

    const files = fs.readdirSync(config.statusDir).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      const filePath = path.join(config.statusDir, file)
      await processStatusFile(filePath, config, seenTasks, saveSeenTasks, log)
    }
  }

  // 初始扫描
  await scanStatusDir()

  // 处理状态文件的函数
  const handleStatusFile = async (filePath: string) => {
    await processStatusFile(filePath, config, seenTasks, saveSeenTasks, log)
  }

  // 设置文件监听
  const watcher = setupWatcher(config.statusDir, handleStatusFile, log)

  // 启动轮询兜底（30秒）
  const pollTimer = startPolling(scanStatusDir, 30000)

  // 优雅退出处理
  const shutdown = () => {
    log.info('正在关闭守护进程...')
    watcher.close()
    clearInterval(pollTimer)
    saveSeenTasks()

    // 清理 PID 文件
    if (pidManager) {
      pidManager.remove()
      log.debug('PID 文件已清理')
    }

    log.info('Task Master 已停止')
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  log.info('守护进程运行中...')
}

/**
 * 加载去重记录
 */
function loadSeenTasks(seenTasks: Map<string, Set<string>>, logger: Logger): void {
  try {
    if (fs.existsSync(MASTER_SEEN_FILE)) {
      const content = fs.readFileSync(MASTER_SEEN_FILE, 'utf-8')
      const data = JSON.parse(content)
      for (const [agent, tasks] of Object.entries(data)) {
        seenTasks.set(agent, new Set(tasks as string[]))
      }
      logger.debug('已加载去重记录')
    }
  } catch (error) {
    logger.warn({ error }, '加载 seen 记录失败，使用空记录')
  }
}

/**
 * 保存去重记录
 */
function saveSeenTasksToFile(seenTasks: Map<string, Set<string>>, logger: Logger): void {
  try {
    const data: Record<string, string[]> = {}
    for (const [agent, tasks] of seenTasks.entries()) {
      data[agent] = Array.from(tasks)
    }
    const dir = path.dirname(MASTER_SEEN_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(MASTER_SEEN_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    logger.error({ error }, '保存 seen 记录失败')
  }
}
