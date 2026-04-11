<h1 align="center">ccnotify</h1>

<div align="center">

**Claude Code 分布式任务完成通知系统**


*在远程机器上运行 Claude Code 任务？任务完成时自动通知你*

[快速开始](#快速开始) • [功能特性](#功能特性) • [命令参考](#命令参考) • [工作原理](#工作原理) • [安装配置](#安装配置) • [常见问题](#常见问题)

</div>



## 为什么需要 ccnotify？

在远程服务器上运行任务时，你无法实时知道任务何时完成。

- 只能反复 SSH 登录检查，或守在终端前
- 长时任务（训练、编译、测试）完成后容易错过
- 多台机器同时运行时，状态管理更混乱

**ccnotify 让远程任务完成时，自动在你的 Mac 上弹出通知。**

## 快速开始

### 1. 本地 Master 安装

```bash
# 安装到全局
npm install -g @zziheng/claude-notify

# 或使用 pnpm
pnpm add -g @zziheng/claude-notify
```

### 2. 远程 Agent 初始化

在远程机器上运行：

```bash
ccnotify agent init
```

按照提示输入：
- Agent 名称（如: gpu-01）
- Master 主机（你的 Mac IP 或 hostname）
- Master 用户名
- 最小任务时长（低于此值不通知，默认 300 秒）

### 3. 配置 SSH 免密登录

```bash
# 在远程机器上执行（按 agent init 提示的地址）
ssh-copy-id yourname@your-mac-ip
```

### 4. 启动 Master 监控

在你的 Mac 上：

```bash
ccnotify master start
```

现在，当远程机器上的 Claude Code 任务完成时，你会收到 macOS 通知！

## 功能特性

- **分布式监控** - 一台 Master 管理多台远程 Agent
- **实时通知** - 任务完成时在 macOS 上弹出通知
- **智能过滤** - 基于任务时长过滤短时噪音
- **SSH 通信** - 无需额外服务，复用 SSH 连接
- **轻量 Agent** - 远程仅需 Node.js + SSH 访问
- **Hook 集成** - 自动注入 Claude Code hooks，无需手动干预
- **状态持久化** - Agent 本地保存状态，重启不丢失

## 命令参考

### Master（本地命令）

#### `ccnotify master start`

启动 Master 守护进程，开始监听远程 Agent 状态。

```bash
# 后台运行（默认）
ccnotify master start

# 前台运行（调试用）
ccnotify master start --foreground
```

#### `ccnotify master status`

查看 Master 运行状态和已连接的 Agents。

```bash
ccnotify master status
```

输出示例：
```
=== Master 状态 ===
运行状态: 运行中
PID: 12345
扫描间隔: 5 秒
通知声音: Glass

--- 已连接 Agents ---
Agent: gpu-01 (user@192.168.1.100)
  最后更新: 2026-04-11 14:30:00
  当前状态: completed
  当前任务: claude-task-abc123
```

#### `ccnotify master stop`

停止 Master 守护进程。

```bash
ccnotify master stop
```

#### `ccnotify master uninstall`

完全卸载 ccnotify，删除配置和 hooks。

```bash
ccnotify master uninstall
```

---

### Agent（远程命令）

#### `ccnotify agent init`

在远程机器上初始化 Agent 配置。

```bash
# 交互式配置
ccnotify agent init

# 非交互模式（适合自动化）
ccnotify agent init \
  --name gpu-01 \
  --master-host your-mac.local \
  --master-user yourname \
  --min-duration 300
```

#### `ccnotify agent status`

查看 Agent 当前状态。

```bash
ccnotify agent status
```

输出示例：
```
=== Agent 状态 ===
Agent 名称: gpu-01
Master: yourname@your-mac.local
最小时长: 300秒
通知启用: 是

--- 运行状态 ---
上次 Stop: 2026-04-11 14:25:00
等待用户: 否
当前任务: claude-task-abc123
会话开始: 2026-04-11 14:00:00
```

#### `ccnotify agent push`

手动推送状态到 Master（调试用）。

```bash
ccnotify agent push --message "自定义状态消息"
```

#### `ccnotify agent stop`

停止 Agent 守护进程。

```bash
ccnotify agent stop
```

#### `ccnotify agent uninstall`

卸载 Agent，删除配置和 hooks。

```bash
ccnotify agent uninstall
```

---

### 全局选项

```bash
# 查看版本
ccnotify --version

# 查看帮助
ccnotify --help
ccnotify master --help
ccnotify agent --help
```

## 工作原理

### 架构概览

```
┌─────────────────┐         SSH          ┌─────────────────┐
│   Remote GPU    │ ◄──────────────────► │   Your Mac      │
│   Agent         │    ~/.task-status    │   Master        │
│   (监控任务)    │                      │   (接收通知)    │
└─────────────────┘                      └─────────────────┘
        │                                         │
        ▼                                         ▼
┌─────────────────┐                      ┌─────────────────┐
│ Claude Code     │                      │ macOS           │
│ Hooks           │                      │ Notification    │
│ (stop/pre/post) │                      │ Center          │
└─────────────────┘                      └─────────────────┘
```

### 数据流

1. **Agent 侧**
   - `ccnotify agent init` 安装 Claude Code hooks 到 `~/.claude/hooks/`
   - Hooks 在任务开始/停止时调用 `~/.task-agent/agent.js`
   - Agent 记录任务状态到 `~/.task-agent/state.json`
   - Agent 通过 SSH 写入状态文件到 Master 的 `~/.task-status/`

2. **Master 侧**
   - `ccnotify master start` 启动守护进程
   - 定期扫描 `~/.task-status/` 目录下的状态文件
   - 解析状态变化，计算任务时长
   - 通过 `alerter` 或 `osascript` 发送 macOS 通知

### 状态文件格式

Agent 写入 Master 的状态文件（`~/.task-status/{agentName}.json`）：

```json
{
  "agentName": "gpu-01",
  "taskId": "claude-task-abc123",
  "status": "completed",
  "message": "代码审查完成",
  "timestamp": 1744348800,
  "duration": 450,
  "workingDir": "/home/user/project"
}
```

### Hook 机制

Agent init 会安装三个 hook：

| Hook 文件 | 触发时机 | 功能 |
|---|---|---|
| `stop.sh` | 任务结束 | 通知 Agent 记录 stop 时间 |
| `pre-askuserquestion.sh` | 提问前 | 标记等待用户状态 |
| `post-askuserquestion.sh` | 提问后 | 清除等待用户状态 |

## 安装配置

### 系统要求

#### Master（本地 Mac）
- macOS 10.14+
- Node.js >= 18.0.0
- `alerter`（可选，推荐安装）

```bash
brew install alerter
```

#### Agent（远程机器）
- Linux/macOS（支持 SSH 的系统）
- Node.js >= 18.0.0
- SSH 服务器运行
- 可免密登录到 Master

### 详细安装步骤

#### Step 1: 安装 ccnotify

```bash
# 全局安装
npm install -g @zziheng/claude-notify

# 验证安装
ccnotify --version
```

#### Step 2: 远程机器配置

SSH 登录到远程机器：

```bash
# 1. 初始化 Agent
ccnotify agent init

# 2. 配置 SSH 密钥（在本机执行）
ssh-copy-id user@remote-host

# 3. 测试连接（在本机执行）
ssh user@remote-host "echo 'SSH 连接成功'"
```

#### Step 3: 启动 Master

在你的 Mac 上：

```bash
# 启动 Master
ccnotify master start

# 验证状态
ccnotify master status
```

### 配置文件

#### Agent 配置

位置：`~/.task-agent/config.toml`

```toml
[agent]
name = "gpu-01"

[master]
host = "your-mac.local"
user = "yourname"
status_path = "~/.task-status"

[behavior]
min_task_duration = 300
enable_notification = true
```

#### Master 配置

位置：`~/.task-master/config.toml`

```toml
[master]
status_dir = "~/.task-status"
scan_interval = 5

[notification]
sound = "Glass"
enable_sound = true
notification_style = "banner"
notification_timeout = 10
auto_style = true
long_task_threshold = 300
```

### 目录结构

安装后创建的文件和目录：

```
~/
├── .task-agent/              # Agent 配置目录（远程机器）
│   ├── config.toml          # Agent 配置文件
│   ├── state.json           # Agent 运行状态
│   └── agent.js             # Agent 可执行文件
├── .task-master/            # Master 配置目录（本地 Mac）
│   └── config.toml          # Master 配置文件
├── .task-status/            # 状态同步目录（Master 侧）
│   ├── gpu-01.json         # Agent 状态文件
│   ├── gpu-02.json
│   └── ...
└── .claude/
    └── hooks/               # Claude Code hooks
        ├── stop.sh
        ├── pre-askuserquestion.sh
        └── post-askuserquestion.sh
```

### macOS 通知权限

首次收到通知时，系统会请求通知权限：

1. 点击"允许"
2. 或手动开启：系统设置 → 通知 → 终端 → 允许通知

## 常见问题

### Q: 为什么收不到通知？

**A:** 按顺序检查：

1. Master 是否运行？
   ```bash
   ccnotify master status
   ```

2. Agent 是否初始化？
   ```bash
   # 在远程机器上
   ccnotify agent status
   ```

3. SSH 连接是否正常？
   ```bash
   # 在本机测试
   ssh user@remote-host "ls ~/.task-status"
   ```

4. macOS 通知权限：
   - 系统设置 → 通知 → 终端 → 允许通知

5. 任务时长是否超过阈值？
   - 默认 300 秒（5 分钟）
   - 可在配置中调整 `min_task_duration`

### Q: 如何调试？

**A:** 使用前台模式查看日志：

```bash
# Master 前台模式
ccnotify master start --foreground

# Agent 手动推送测试
ccnotify agent push --message "测试消息"
```

日志位置：
- Master: `~/.task-master/master.log`
- Agent: `~/.task-agent/agent.log`

### Q: 支持多台远程机器吗？

**A:** 支持！在每台远程机器上独立运行 `ccnotify agent init`，配置不同的 `agentName` 即可。Master 会自动识别所有 Agents。

### Q: 通知可以自定义吗？

**A:** 可以。编辑 `~/.task-master/config.toml`：

```toml
[notification]
sound = "Ping"                    # 通知声音
enable_sound = true
notification_style = "banner"     # banner | alert（持久化）
notification_timeout = 10         # 横幅超时（秒）
long_task_threshold = 600         # 长任务阈值（秒）
```

### Q: 如何完全卸载？

**A:**

远程机器：
```bash
ccnotify agent uninstall
```

本地 Mac：
```bash
ccnotify master stop
ccnotify master uninstall
```

### Q: 不安装 alerter 可以吗？

**A:** 可以。未安装 alerter 时会自动降级使用 macOS 原生的 `osascript`，功能相同但交互能力较弱。推荐安装 alerter 获得完整功能。

## 技术栈

- **Runtime**: Node.js >= 18.0.0
- **CLI 框架**: commander, cac
- **SSH**: ssh2
- **配置**: smol-toml, proper-lockfile
- **日志**: pino
- **通知**: alerter (macOS), osascript (fallback)
- **文件监控**: chokidar
- **构建**: tsup, TypeScript
- **测试**: vitest
- **代码质量**: biome

## 开发

```bash
# 克隆仓库
git clone https://github.com/Shadowzzh/claude-notify.git
cd claude-notify

# 安装依赖
pnpm install

# 开发模式（监听编译）
pnpm dev

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

### 项目结构

```
claude-notify/
├── src/
│   ├── cli.ts              # CLI 入口
│   ├── agent/              # Agent 相关代码
│   │   ├── commands/       # Agent 命令
│   │   └── ssh.ts          # SSH 连接管理
│   ├── master/             # Master 相关代码
│   │   ├── commands/       # Master 命令
│   │   ├── daemon/         # 守护进程
│   │   ├── notifier/       # 通知模块
│   │   └── processor/      # 状态处理器
│   └── shared/             # 共享代码
│       ├── config.ts       # 配置加载
│       ├── schemas.ts      # Zod 校验
│       ├── types.ts        # TypeScript 类型
│       └── index.ts        # 导出工具函数
├── dist/                   # 编译输出
├── docs/                   # 文档
├── test-simulator.sh       # 本地测试脚本
└── package.json
```
