# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

使用中文回复

## 项目概述

这是一个 Claude Code 分布式任务完成通知系统,用于在远程机器上运行 Claude Code 时,将任务完成状态通知到本地机器。

**核心架构:**
- **Agent (apps/agent)**: 运行在远程机器上,通过 Claude Code Hooks 监听任务状态,并通过 SSH/SFTP 推送状态文件到 Master
- **Master (apps/master)**: 运行在本地机器上,监听状态文件变化并发送系统通知
- **Shared (packages/shared)**: 共享的类型定义、配置管理和工具函数

## 常用命令

### 开发命令
```bash
# 安装依赖
pnpm install

# 构建所有包 (packages -> apps 顺序)
pnpm build

# 开发模式 (watch 模式)
pnpm dev

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 格式化代码
pnpm format

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 完整检查 (格式化 + lint + 类型检查)
pnpm all
```

### Agent 命令
```bash
# 构建 agent
cd apps/agent && pnpm build

# 初始化配置 (交互式)
agent init

# 查看当前状态
agent status

# 手动推送状态
agent push <status> --message "消息" --duration 60

# Hook 命令 (由 Claude Code 自动调用)
agent hook:stop --cwd /path/to/project
agent hook:pre-ask
agent hook:post-ask
```

### Master 命令
```bash
# 构建 master
cd apps/master && pnpm build

# 前台启动守护进程
task-master start --foreground

# 后台启动守护进程
task-master start

# 停止守护进程
task-master stop

# 安装为系统服务 (macOS LaunchAgent)
task-master install-service

# 卸载系统服务 (会询问是否删除配置文件)
task-master uninstall-service

# 查看服务状态
task-master status
```

## 架构设计

### 工作流程

1. **Agent 端 (远程机器)**:
   - Claude Code 通过 Hooks 触发 agent 命令
   - `hook:stop`: 任务完成时触发,计算任务时长,判断是否需要通知
   - `hook:pre-ask`: 用户提问前触发,标记进入等待状态
   - `hook:post-ask`: 用户回答后触发,恢复工作状态
   - Agent 通过 SSH/SFTP 将状态文件推送到 Master 的 `~/.task-status/` 目录

2. **Master 端 (本地机器)**:
   - 使用 `chokidar` 监听 `~/.task-status/` 目录的文件变化
   - 使用文件锁 (`proper-lockfile`) 防止并发读取
   - 读取状态文件并发送系统通知
   - 优先使用 `alerter` 发送通知，不可用时降级到 `osascript`
   - 使用 `seen.json` 记录已处理的任务,防止重复通知

### 状态管理

**Agent 状态 (`~/.task-agent/state.json`)**:
- `lastStopTime`: 上次停止时间
- `isWaitingForUser`: 是否在等待用户输入
- `currentTaskId`: 当前任务 ID
- `sessionStart`: 会话开始时间

**Master 去重记录 (`~/.task-master/seen.json`)**:
- 记录每个 agent 已处理的任务 ID
- 每个 agent 最多保存 100 条记录

### 配置文件

**Agent 配置 (`~/.task-agent/config.toml`)**:
```toml
agent_name = "my-agent"

[master]
host = "192.168.1.100"
user = "username"
status_path = "~/.task-status"
port = 22  # 可选

[behavior]
min_task_duration = 60  # 最小任务时长(秒)
enable_notification = true
```

**Master 配置 (`~/.task-master/config.toml`)**:
```toml
status_dir = "~/.task-status"
scan_interval = 10000  # 扫描间隔(毫秒)

# 通知声音配置
notification_sound = "Glass"
enable_sound = true

# 通知样式配置
notification_style = "banner"  # "banner" (自动消失) 或 "alert" (需要点击关闭)
notification_timeout = 5       # 自动消失时长(秒), 仅对 banner 有效
auto_style = true              # 是否根据任务时长自动选择样式
long_task_threshold = 300      # 长任务阈值(秒), 超过此时长使用 alert 样式
```

**通知功能说明**:
- 支持两种通知方式: `alerter` (推荐) 和 `osascript` (降级方案)
- 使用 `alerter` 可获得更好的通知体验:
  - 持久化通知 (长任务不会自动消失)
  - 点击通知跳转到项目目录
  - 通知分组管理
  - 灵活的超时控制
- 安装 alerter: `brew install vjeantet/tap/alerter`
- 如果未安装 alerter, 系统会自动降级使用 macOS 原生的 osascript

## 关键技术点

### SSH 连接
- Agent 使用 `ssh2` 库通过 SFTP 推送状态文件
- 使用系统 SSH 配置 (支持 SSH key 认证)
- 内置重试机制 (`p-retry`): 3 次重试,最大超时 5 秒

### 文件监听
- Master 使用 `chokidar` 监听状态目录
- 配置 `awaitWriteFinish` 确保文件写入完成后再处理
- 30 秒轮询兜底,防止文件变化事件丢失

### 通知去重
- 使用 `taskId` (UUID) 唯一标识每个任务
- Master 维护 `seen.json` 记录已处理的任务
- 防止文件变化事件触发重复通知

### Claude Code Hooks 集成
- `hook:stop`: 在 Claude Code 停止工作时触发
- `hook:pre-ask`: 在 Claude Code 向用户提问前触发
- `hook:post-ask`: 在用户回答问题后触发
- Hooks 配置在 `~/.claude/settings.json` 中

## 项目结构

```
.
├── apps/
│   ├── agent/          # Agent 应用 (远程机器)
│   │   ├── src/
│   │   │   ├── cli.ts           # CLI 入口
│   │   │   ├── ssh.ts           # SSH/SFTP 推送逻辑
│   │   │   └── commands/        # 各种命令实现
│   │   │       ├── init.ts      # 初始化配置
│   │   │       ├── stop.ts      # Stop Hook 处理
│   │   │       ├── pre-ask.ts   # Pre-Ask Hook 处理
│   │   │       ├── post-ask.ts  # Post-Ask Hook 处理
│   │   │       ├── push.ts      # 手动推送
│   │   │       └── status.ts    # 查看状态
│   │   └── package.json
│   └── master/         # Master 应用 (本地机器)
│       ├── src/
│       │   ├── cli.ts              # CLI 入口
│       │   ├── daemon.ts           # 守护进程主逻辑
│       │   ├── processor.ts        # 状态文件处理
│       │   ├── notifier/           # 通知发送
│       │   ├── install-service.js  # 安装系统服务
│       │   └── uninstall-service.js # 卸载系统服务
│       └── package.json
└── packages/
    └── shared/         # 共享代码
        ├── src/
        │   ├── types.ts     # 类型定义
        │   ├── schemas.ts   # Zod 验证模式
        │   └── config.ts    # 配置管理工具
        └── package.json
```

## 开发注意事项

### Monorepo 结构
- 使用 pnpm workspace 管理多包
- 构建顺序: `packages/shared` -> `apps/agent` + `apps/master`
- 使用 `workspace:*` 引用本地包

### TypeScript 配置
- 使用 TypeScript Project References
- 根目录 `tsconfig.json` 定义所有子项目引用
- 每个子项目有独立的 `tsconfig.json`

### 构建工具
- 使用 `tsup` 构建 TypeScript 代码
- 输出 ESM 格式 (`type: "module"`)
- 生成类型声明文件 (`.d.ts`)

### 代码质量
- 使用 Biome 进行 lint 和格式化
- 使用 Vitest 进行单元测试
- 所有代码必须通过类型检查

### 日志
- 使用 `pino` 作为日志库
- 开发环境使用 `pino-pretty` 美化输出
- Master 守护进程日志输出到 `~/.task-master/stdout.log` 和 `stderr.log`

## 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test packages/shared/src/schemas.test.ts
```

## 部署

### Agent 部署 (远程机器)
1. 构建: `cd apps/agent && pnpm build`
2. 全局安装: `pnpm link --global` 或复制 `dist/` 到目标机器
3. 初始化配置: `agent init`
4. 配置 Claude Code Hooks (在 `~/.claude/settings.json`)

### Master 部署 (本地机器)
1. 构建: `cd apps/master && pnpm build`
2. 全局安装: `pnpm link --global`
3. 安装为系统服务: `task-master install-service`
4. 启动服务: `launchctl load ~/Library/LaunchAgents/com.task-master.plist`
