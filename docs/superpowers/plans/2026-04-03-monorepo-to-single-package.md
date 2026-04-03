# Monorepo 迁移到单包结构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目从 Monorepo 结构迁移到扁平化的单包结构，保留 src/ 代码

**Architecture:** 删除 apps/ 和 packages/ 目录，创建独立的 CLI 入口文件，合并所有依赖到根 package.json

**Tech Stack:** TypeScript, tsup, pnpm

---

## Task 1: 备份和准备

**Files:**
- Check: `src/`, `apps/`, `packages/`

- [ ] **Step 1: 创建新分支**

```bash
git checkout -b refactor/remove-monorepo
```

- [ ] **Step 2: 检查当前 git 状态**

```bash
git status
```

Expected: 显示当前修改的文件

- [ ] **Step 3: 提交当前更改（如果有）**

```bash
git add -A
git commit -m "chore: save current state before monorepo migration"
```

- [ ] **Step 4: 验证 src/ 目录存在**

```bash
ls -la src/
```

Expected: 显示 agent/, master/, shared/ 目录

---

## Task 2: 创建 CLI 入口文件

**Files:**
- Create: `src/cli/agent.ts`
- Create: `src/cli/master.ts`
- Reference: `src/cli.ts` (旧入口)

- [ ] **Step 1: 创建 cli 目录**

```bash
mkdir -p src/cli
```

- [ ] **Step 2: 读取旧的 CLI 入口**

```bash
cat src/cli.ts
```

- [ ] **Step 3: 创建 agent CLI 入口**

创建 `src/cli/agent.ts`:
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { agentCommands } from '../agent/commands/index.js';

const program = new Command();

program
  .name('agent')
  .description('Claude Code Hook Notify - Agent (远程机器)')
  .version('1.0.0');

agentCommands(program);

program.parse();
```

- [ ] **Step 4: 创建 master CLI 入口**

创建 `src/cli/master.ts`:
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { masterCommands } from '../master/commands/index.js';

const program = new Command();

program
  .name('task-master')
  .description('Claude Code Hook Notify - Master (本地机器)')
  .version('1.0.0');

masterCommands(program);

program.parse();
```

- [ ] **Step 5: 验证文件创建**

```bash
ls -la src/cli/
```

Expected: 显示 agent.ts 和 master.ts

- [ ] **Step 6: 提交**

```bash
git add src/cli/
git commit -m "feat: create separate CLI entry points for agent and master"
```

---

## Task 3: 更新 package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 备份当前 package.json**

```bash
cp package.json package.json.backup
```

- [ ] **Step 2: 更新 package.json**

修改 `package.json`:
```json
{
  "name": "@zziheng/claude-notify",
  "version": "1.0.0",
  "description": "Claude Code 分布式任务完成通知系统",
  "type": "module",
  "bin": {
    "agent": "./dist/cli/agent.js",
    "task-master": "./dist/cli/master.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "all": "pnpm format && pnpm lint:fix && pnpm typecheck"
  },
  "dependencies": {
    "@inquirer/confirm": "^6.0.4",
    "@inquirer/input": "^5.0.4",
    "@inquirer/number": "^4.0.4",
    "cac": "^6.7.14",
    "chokidar": "^3.6.0",
    "commander": "^12.0.0",
    "p-retry": "^6.2.0",
    "pino": "^9.6.0",
    "proper-lockfile": "^4.0.0",
    "smol-toml": "^1.3.0",
    "ssh2": "^1.16.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/node": "^22.10.5",
    "@types/proper-lockfile": "^4.1.4",
    "@types/ssh2": "^1.15.3",
    "pino-pretty": "^13.1.3",
    "tsup": "^8.3.5",
    "tsx": "^4.21.0",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/Shadowzzh/claude-notify.git"
  },
  "bugs": {
    "url": "https://github.com/Shadowzzh/claude-notify/issues"
  },
  "homepage": "https://github.com/Shadowzzh/claude-notify#readme",
  "keywords": ["claude", "claude-code", "notification", "task-notify", "ssh", "remote"],
  "author": "Shadowzzh",
  "license": "MIT"
}
```

- [ ] **Step 3: 验证 JSON 格式**

```bash
cat package.json | jq .
```

Expected: 正确解析 JSON

- [ ] **Step 4: 提交**

```bash
git add package.json
git commit -m "chore: update package.json for single package structure"
```

---

## Task 4: 更新构建配置

**Files:**
- Modify: `tsup.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: 更新 tsup.config.ts**

修改 `tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/agent.ts', 'src/cli/master.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
});
```

- [ ] **Step 2: 更新 tsconfig.json**

修改 `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "apps", "packages"]
}
```

- [ ] **Step 3: 提交**

```bash
git add tsup.config.ts tsconfig.json
git commit -m "chore: update build configs for single package"
```

---

## Task 5: 检查并更新导入路径

**Files:**
- Check: `src/**/*.ts`

- [ ] **Step 1: 搜索 @task/shared 导入**

```bash
grep -r "@task/shared" src/ || echo "No @task/shared imports found"
```

Expected: 如果没有输出或显示 "No @task/shared imports found"，跳过后续步骤

- [ ] **Step 2: 如果找到导入，列出文件**

```bash
grep -rl "@task/shared" src/
```

- [ ] **Step 3: 手动检查并更新每个文件**

对于每个包含 `@task/shared` 的文件，将导入改为相对路径。

示例：
```typescript
// 之前
import { AgentConfig } from '@task/shared';

// 之后
import { AgentConfig } from '../shared/index.js';
```

- [ ] **Step 4: 验证没有 @task/shared 导入**

```bash
grep -r "@task/shared" src/
```

Expected: 无输出

- [ ] **Step 5: 提交（如果有更改）**

```bash
git add src/
git commit -m "refactor: replace @task/shared imports with relative paths"
```

---

## Task 6: 删除 Monorepo 文件

**Files:**
- Delete: `pnpm-workspace.yaml`
- Delete: `apps/` (整个目录)
- Delete: `packages/` (整个目录)
- Delete: `src/cli.ts` (旧入口)

- [ ] **Step 1: 删除 pnpm-workspace.yaml**

```bash
rm pnpm-workspace.yaml
```

- [ ] **Step 2: 删除 apps 目录**

```bash
rm -rf apps/
```

- [ ] **Step 3: 删除 packages 目录**

```bash
rm -rf packages/
```

- [ ] **Step 4: 删除旧的 CLI 入口**

```bash
rm src/cli.ts
```

- [ ] **Step 5: 验证删除**

```bash
ls -la | grep -E "apps|packages|pnpm-workspace"
ls src/cli.ts 2>&1
```

Expected: 第一个命令无输出，第二个命令显示文件不存在

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: remove monorepo structure (apps, packages, workspace config)"
```

---

## Task 7: 重新安装依赖和构建

**Files:**
- Modify: `node_modules/`, `pnpm-lock.yaml`
- Create: `dist/`

- [ ] **Step 1: 清理旧依赖**

```bash
rm -rf node_modules pnpm-lock.yaml
```

- [ ] **Step 2: 安装依赖**

```bash
pnpm install
```

Expected: 成功安装所有依赖

- [ ] **Step 3: 运行类型检查**

```bash
pnpm typecheck
```

Expected: 无类型错误

- [ ] **Step 4: 运行构建**

```bash
pnpm build
```

Expected: 成功构建，生成 dist/cli/agent.js 和 dist/cli/master.js

- [ ] **Step 5: 验证构建产物**

```bash
ls -la dist/cli/
```

Expected: 显示 agent.js 和 master.js

- [ ] **Step 6: 提交 lock 文件**

```bash
git add pnpm-lock.yaml
git commit -m "chore: update dependencies after monorepo removal"
```

---

## Task 8: 验证 CLI 命令

**Files:**
- Test: `dist/cli/agent.js`
- Test: `dist/cli/master.js`

- [ ] **Step 1: 测试 agent 命令帮助**

```bash
node dist/cli/agent.js --help
```

Expected: 显示 agent 命令帮助信息

- [ ] **Step 2: 测试 master 命令帮助**

```bash
node dist/cli/master.js --help
```

Expected: 显示 master 命令帮助信息

- [ ] **Step 3: 测试 agent status（如果配置存在）**

```bash
node dist/cli/agent.js status || echo "Config not found (expected)"
```

Expected: 显示状态或提示配置不存在

- [ ] **Step 4: 测试 master status**

```bash
node dist/cli/master.js status || echo "Daemon not running (expected)"
```

Expected: 显示状态或提示守护进程未运行

---

## Task 9: 运行完整检查

**Files:**
- Check: 所有源文件

- [ ] **Step 1: 运行格式化**

```bash
pnpm format
```

Expected: 格式化完成

- [ ] **Step 2: 运行 lint**

```bash
pnpm lint:fix
```

Expected: 无 lint 错误

- [ ] **Step 3: 运行类型检查**

```bash
pnpm typecheck
```

Expected: 无类型错误

- [ ] **Step 4: 运行完整检查**

```bash
pnpm all
```

Expected: 所有检查通过

- [ ] **Step 5: 提交格式化更改（如果有）**

```bash
git add -A
git commit -m "style: format code after migration" || echo "No changes to commit"
```

---

## Task 10: 更新文档

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新 CLAUDE.md 中的项目结构说明**

在 `CLAUDE.md` 中找到项目结构部分，更新为：

```markdown
## 项目结构

```
.
├── src/
│   ├── cli/            # CLI 入口
│   │   ├── agent.ts    # Agent CLI
│   │   └── master.ts   # Master CLI
│   ├── agent/          # Agent 应用
│   │   ├── commands/   # 各种命令实现
│   │   └── ssh.ts      # SSH/SFTP 推送逻辑
│   ├── master/         # Master 应用
│   │   ├── commands/   # 各种命令实现
│   │   ├── daemon/     # 守护进程
│   │   ├── notifier/   # 通知发送
│   │   └── processor/  # 状态文件处理
│   └── shared/         # 共享代码
│       ├── types.ts    # 类型定义
│       ├── schemas.ts  # Zod 验证模式
│       └── config.ts   # 配置管理工具
├── package.json        # 单包配置
└── tsconfig.json
```
```

- [ ] **Step 2: 更新常用命令部分**

确保 Agent 和 Master 命令使用正确的命令名：
- `agent` 替代之前的路径调用
- `task-master` 替代之前的路径调用

- [ ] **Step 3: 删除 Monorepo 相关说明**

删除关于 workspace、pnpm -r 等 Monorepo 相关的说明

- [ ] **Step 4: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for single package structure"
```

---

## Task 11: 最终验证和合并

**Files:**
- Check: 所有文件

- [ ] **Step 1: 查看所有更改**

```bash
git log --oneline origin/main..HEAD
```

Expected: 显示所有迁移相关的提交

- [ ] **Step 2: 运行最终构建**

```bash
pnpm build
```

Expected: 构建成功

- [ ] **Step 3: 运行最终检查**

```bash
pnpm all
```

Expected: 所有检查通过

- [ ] **Step 4: 查看文件结构**

```bash
tree -L 2 -I 'node_modules|dist' .
```

Expected: 显示清理后的项目结构，无 apps/ 和 packages/

- [ ] **Step 5: 推送分支**

```bash
git push -u origin refactor/remove-monorepo
```

Expected: 成功推送到远程

---

## Self-Review Checklist

✓ **Spec coverage:** 所有迁移步骤都已覆盖
  - 删除 Monorepo 配置 ✓
  - 创建 CLI 入口 ✓
  - 更新配置文件 ✓
  - 更新导入路径 ✓
  - 重新安装依赖 ✓
  - 验证功能 ✓
  - 更新文档 ✓

✓ **No placeholders:** 所有步骤都包含具体命令和代码

✓ **Type consistency:** CLI 入口文件使用一致的导入和命名

✓ **File paths:** 所有文件路径都是精确的

✓ **Commands:** 所有命令都包含预期输出
