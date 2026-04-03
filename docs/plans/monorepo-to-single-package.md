# 从 Monorepo 迁移到单包结构 - 设计文档

## 目标

将项目从 Monorepo 结构（apps/ + packages/）迁移到扁平化的单包结构，保留根目录 `src/` 的代码。

## 当前状态

项目存在两套代码：
- **Monorepo 结构**：`apps/agent/`, `apps/master/`, `packages/shared/`
- **单体结构**：`src/agent/`, `src/master/`, `src/shared/`

需要清理 Monorepo 相关配置，统一为单包结构。

## 目标结构（方案 1：扁平化）

```
claude-hook-notify/
├── src/
│   ├── cli/
│   │   ├── agent.ts          # agent CLI 入口
│   │   └── master.ts         # master CLI 入口
│   ├── agent/
│   │   ├── commands/
│   │   │   ├── index.ts
│   │   │   ├── init.ts
│   │   │   ├── status.ts
│   │   │   ├── push.ts
│   │   │   ├── stop.ts
│   │   │   ├── pre-ask.ts
│   │   │   └── post-ask.ts
│   │   └── ssh.ts
│   ├── master/
│   │   ├── commands/
│   │   │   ├── index.ts
│   │   │   ├── start.ts
│   │   │   ├── stop.ts
│   │   │   └── status.ts
│   │   ├── daemon/
│   │   │   ├── core.ts
│   │   │   ├── manager.ts
│   │   │   ├── watcher.ts
│   │   │   └── polling.ts
│   │   ├── notifier/
│   │   │   └── index.ts
│   │   ├── processor/
│   │   │   └── index.ts
│   │   └── service/
│   │       ├── install.ts
│   │       └── uninstall.ts
│   ├── shared/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── config.ts
│   │   └── pid.ts
│   └── utils/                # 新增：通用工具
├── package.json              # 单包配置
├── tsconfig.json
├── tsup.config.ts
├── biome.json
└── vitest.config.ts
```

## 迁移步骤

### 1. 清理 Monorepo 配置文件

**删除文件**：
- `pnpm-workspace.yaml`
- `apps/` 目录（整个）
- `packages/` 目录（整个）

**保留文件**：
- `src/` 目录（当前代码基础）
- 根目录配置文件

### 2. 创建 CLI 入口文件

创建 `src/cli/agent.ts`：
```typescript
#!/usr/bin/env node
import { agentCommands } from '../agent/commands/index.js';
// CLI 逻辑
```

创建 `src/cli/master.ts`：
```typescript
#!/usr/bin/env node
import { masterCommands } from '../master/commands/index.js';
// CLI 逻辑
```

### 3. 更新 package.json

合并所有依赖到根目录 `package.json`：

```json
{
  "name": "@zziheng/claude-notify",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "agent": "./dist/cli/agent.js",
    "task-master": "./dist/cli/master.js"
  },
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
  }
}
```

### 4. 更新 tsup.config.ts

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

### 5. 更新 tsconfig.json

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
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 6. 更新导入路径

检查并更新所有导入路径：

**查找需要更新的文件**：
```bash
grep -r "@task/shared" src/
```

**批量替换**（如果没有 @task/shared 导入则跳过此步骤）：
```typescript
// 之前
import { AgentConfig } from '@task/shared';

// 之后
import { AgentConfig } from '../shared/index.js';
```

**注意**：根据当前代码检查，`src/` 目录可能已经使用相对路径，无需修改。

### 7. 重新安装依赖

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 文件变更清单

### 需要删除的文件/目录
- `apps/` (整个目录)
- `packages/` (整个目录)
- `pnpm-workspace.yaml`
- `src/cli.ts` (旧的统一入口)

### 需要创建的文件
- `src/cli/agent.ts`
- `src/cli/master.ts`
- `src/utils/` (可选，用于通用工具函数)

### 需要修改的文件
- `package.json` - 合并依赖，更新 bin 配置
- `tsup.config.ts` - 更新入口文件
- `tsconfig.json` - 简化配置
- 所有包含 `@task/shared` 导入的文件

## 风险评估

### 低风险
- 删除 Monorepo 配置文件
- 合并依赖到根 package.json

### 中风险
- 更新导入路径（需要批量替换）
- CLI 入口拆分（需要测试）

### 缓解措施
1. 在新分支进行迁移
2. 迁移后运行完整测试
3. 验证两个 CLI 命令都能正常工作

## 验证步骤

迁移完成后，执行以下验证：

```bash
# 1. 构建检查
pnpm build

# 2. 类型检查
pnpm typecheck

# 3. 代码检查
pnpm all

# 4. 测试 agent 命令
agent --help
agent status

# 5. 测试 master 命令
task-master --help
task-master status
```

## 预期收益

1. **简化结构**：去掉 Monorepo 复杂性
2. **统一依赖**：所有依赖在一个 package.json
3. **构建更快**：单次构建，无需处理依赖顺序
4. **易于维护**：代码在一个地方，导入路径清晰

## 后续优化建议

1. 考虑将 service 安装脚本移到独立目录
2. 添加 `src/utils/` 存放通用工具函数
3. 统一日志配置到 `src/shared/logger.ts`

