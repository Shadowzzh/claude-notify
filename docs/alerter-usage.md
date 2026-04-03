# alerter - macOS 通知工具使用指南

## 1. 简介

alerter 是一个功能强大的 macOS 命令行通知工具，相比系统原生的 `osascript` 和 `terminal-notifier`，提供了更丰富的功能和更好的用户体验。

### 主要优势

- **持久化通知**: 支持 `alert` 类型的持久化通知，不会自动消失
- **交互能力强**: 支持自定义操作按钮、文本输入、下拉选择等
- **点击跳转**: 支持点击通知后打开 URL 或执行命令
- **返回值丰富**: 可以获取用户的操作结果（点击了哪个按钮、输入了什么内容）
- **自定义图标**: 支持使用应用图标或自定义图片
- **声音控制**: 支持自定义通知声音
- **超时控制**: 可以设置通知自动关闭时间
- **通知中心集成**: 通知会保存在通知中心，可以查看历史记录

## 2. 安装方法

### 使用 Homebrew 安装（推荐）

```bash
brew install alerter
```

### 手动安装

从 [GitHub Releases](https://github.com/vjeantet/alerter/releases) 下载最新版本：

```bash
# 下载并解压
curl -L https://github.com/vjeantet/alerter/releases/latest/download/alerter.zip -o alerter.zip
unzip alerter.zip

# 移动到系统路径
sudo mv alerter /usr/local/bin/
sudo chmod +x /usr/local/bin/alerter
```

### 验证安装

```bash
alerter --version
```

## 3. 基本用法示例

### 简单通知

```bash
# 最简单的通知
alerter -message "Hello World"

# 带标题的通知
alerter -title "任务完成" -message "Claude Code 已完成任务"

# 带副标题的通知
alerter -title "任务完成" \
        -subtitle "项目: my-project" \
        -message "耗时: 2分30秒"
```

### 带声音的通知

```bash
# 使用系统声音
alerter -title "任务完成" \
        -message "Claude Code 已完成任务" \
        -sound Glass

# 常用声音: Glass, Ping, Pop, Purr, Submarine, Tink
```

### 自定义图标

```bash
# 使用应用图标
alerter -title "任务完成" \
        -message "构建成功" \
        -appIcon "com.apple.Terminal"

# 使用自定义图片
alerter -title "任务完成" \
        -message "构建成功" \
        -contentImage "/path/to/image.png"
```

## 4. 高级功能

### 4.1 持久化通知（Alert 类型）

持久化通知不会自动消失，需要用户手动关闭：

```bash
# 创建持久化通知
alerter -title "重要提醒" \
        -message "请检查构建结果" \
        -style alert
```

### 4.2 超时控制

设置通知自动关闭时间：

```bash
# 10 秒后自动关闭
alerter -title "临时通知" \
        -message "此通知将在 10 秒后消失" \
        -timeout 10

# 配合持久化通知使用（超时后自动关闭 alert）
alerter -title "重要提醒" \
        -message "请在 30 秒内确认" \
        -style alert \
        -timeout 30
```

### 4.3 点击跳转

点击通知后打开 URL 或执行命令：

```bash
# 点击后打开网页
alerter -title "构建完成" \
        -message "点击查看构建报告" \
        -open "https://example.com/build-report"

# 点击后打开文件
alerter -title "日志已生成" \
        -message "点击查看日志文件" \
        -open "file:///path/to/log.txt"

# 点击后执行命令
alerter -title "任务完成" \
        -message "点击打开项目目录" \
        -execute "open /path/to/project"
```

### 4.4 操作按钮

添加自定义操作按钮，获取用户选择：

```bash
# 单个操作按钮
alerter -title "确认操作" \
        -message "是否继续部署？" \
        -actions "继续部署"

# 多个操作按钮
alerter -title "选择操作" \
        -message "请选择下一步操作" \
        -actions "部署到生产环境,部署到测试环境,取消"

# 获取用户点击的按钮
RESULT=$(alerter -title "确认" \
                 -message "是否继续？" \
                 -actions "确定,取消")
echo "用户选择: $RESULT"
# 输出: @CONTENTIMAGE@ 或 确定 或 取消
```

### 4.5 文本输入

让用户在通知中输入文本：

```bash
# 简单文本输入
alerter -title "输入信息" \
        -message "请输入提交信息" \
        -reply

# 获取用户输入
RESULT=$(alerter -title "Git Commit" \
                 -message "请输入 commit message" \
                 -reply)
echo "用户输入: $RESULT"

# 带占位符的文本输入
alerter -title "输入信息" \
        -message "请输入分支名称" \
        -reply \
        -placeholder "feature/xxx"
```

### 4.6 下拉选择

提供下拉菜单供用户选择：

```bash
# 下拉选择
alerter -title "选择环境" \
        -message "请选择部署环境" \
        -dropdownLabel "环境:" \
        -dropdown "开发环境,测试环境,预发布环境,生产环境"

# 获取用户选择
RESULT=$(alerter -title "选择分支" \
                 -message "请选择要合并的分支" \
                 -dropdownLabel "分支:" \
                 -dropdown "main,develop,feature/xxx")
echo "用户选择: $RESULT"
```

### 4.7 组合使用

结合多种功能创建复杂交互：

```bash
# 带按钮和输入的通知
alerter -title "Git Commit" \
        -message "请输入 commit message 并选择操作" \
        -reply \
        -actions "提交并推送,仅提交,取消" \
        -sound Glass

# 带下拉和按钮的通知
alerter -title "部署应用" \
        -message "选择环境并确认部署" \
        -dropdownLabel "环境:" \
        -dropdown "测试,预发布,生产" \
        -actions "部署,取消" \
        -style alert
```

## 5. 完整命令行参数说明

### 基本参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-message <text>` | 通知消息内容（必需） | `-message "任务完成"` |
| `-title <text>` | 通知标题 | `-title "Claude Code"` |
| `-subtitle <text>` | 通知副标题 | `-subtitle "项目: my-app"` |
| `-sound <name>` | 通知声音 | `-sound Glass` |

### 样式参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-style <type>` | 通知样式: `banner`(默认) 或 `alert`(持久化) | `-style alert` |
| `-appIcon <bundle>` | 应用图标（Bundle ID） | `-appIcon com.apple.Terminal` |
| `-contentImage <path>` | 内容图片路径 | `-contentImage /path/to/img.png` |

### 交互参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-actions <list>` | 操作按钮（逗号分隔） | `-actions "确定,取消"` |
| `-reply` | 启用文本输入 | `-reply` |
| `-placeholder <text>` | 输入框占位符 | `-placeholder "请输入..."` |
| `-dropdown <list>` | 下拉选择项（逗号分隔） | `-dropdown "选项1,选项2"` |
| `-dropdownLabel <text>` | 下拉菜单标签 | `-dropdownLabel "选择:"` |

### 行为参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-timeout <seconds>` | 自动关闭时间（秒） | `-timeout 10` |
| `-closeLabel <text>` | 关闭按钮文本 | `-closeLabel "关闭"` |
| `-open <url>` | 点击后打开的 URL | `-open "https://example.com"` |
| `-execute <command>` | 点击后执行的命令 | `-execute "open ."` |

### 分组参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-group <id>` | 通知分组 ID（相同 ID 的通知会合并） | `-group "build-notifications"` |
| `-sender <bundle>` | 发送者 Bundle ID | `-sender "com.apple.Terminal"` |

### 其他参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-json` | 以 JSON 格式输出结果 | `-json` |
| `-ignoreDnD` | 忽略勿扰模式 | `-ignoreDnD` |

## 6. 与其他工具对比

### 6.1 vs osascript (原生 AppleScript)

**osascript 示例:**
```bash
osascript -e 'display notification "任务完成" with title "Claude Code" sound name "Glass"'
```

**优势对比:**

| 功能 | osascript | alerter |
|------|-----------|---------|
| 基本通知 | ✅ | ✅ |
| 自定义声音 | ✅ | ✅ |
| 持久化通知 | ❌ | ✅ |
| 操作按钮 | ❌ | ✅ |
| 文本输入 | ❌ | ✅ |
| 点击跳转 | ❌ | ✅ |
| 返回值 | ❌ | ✅ |
| 自定义图标 | ❌ | ✅ |
| 超时控制 | ❌ | ✅ |

**结论**: osascript 只能发送简单的横幅通知，功能非常有限。

### 6.2 vs terminal-notifier

**terminal-notifier 示例:**
```bash
terminal-notifier -title "Claude Code" -message "任务完成" -sound Glass
```

**优势对比:**

| 功能 | terminal-notifier | alerter |
|------|-------------------|---------|
| 基本通知 | ✅ | ✅ |
| 自定义声音 | ✅ | ✅ |
| 持久化通知 | ❌ | ✅ |
| 操作按钮 | ✅ (有限) | ✅ (完整) |
| 文本输入 | ❌ | ✅ |
| 下拉选择 | ❌ | ✅ |
| 点击跳转 | ✅ | ✅ |
| 返回值 | ✅ (有限) | ✅ (完整) |
| 自定义图标 | ✅ | ✅ |
| 超时控制 | ❌ | ✅ |
| 维护状态 | ⚠️ 不活跃 | ✅ 活跃 |

**结论**: alerter 是 terminal-notifier 的增强版本，功能更完整，且项目更活跃。

### 6.3 推荐使用场景

- **简单通知**: 三者都可以，但 alerter 语法更清晰
- **需要用户交互**: 只能用 alerter
- **需要持久化通知**: 只能用 alerter
- **需要获取用户输入**: 只能用 alerter
- **兼容性优先**: 使用 osascript（系统自带）
- **轻量级需求**: 使用 terminal-notifier

## 7. 项目集成建议

### 7.1 在 Master 中使用 alerter

修改 `/Users/zhangziheng/Documents/github/claude-hook-notify/apps/master/src/notifier/index.ts`:

```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { TaskStatus } from '@task-notify/shared';

const execAsync = promisify(exec);

export interface NotificationOptions {
  title: string;
  message: string;
  subtitle?: string;
  sound?: string;
  persistent?: boolean;  // 是否持久化
  timeout?: number;      // 超时时间（秒）
  actions?: string[];    // 操作按钮
  openUrl?: string;      // 点击后打开的 URL
}

/**
 * 检查 alerter 是否可用
 */
async function isAlerterAvailable(): Promise<boolean> {
  try {
    await execAsync('which alerter');
    return true;
  } catch {
    return false;
  }
}

/**
 * 使用 alerter 发送通知
 */
async function sendAlerterNotification(options: NotificationOptions): Promise<void> {
  const args: string[] = [
    '-title', `"${options.title}"`,
    '-message', `"${options.message}"`,
  ];

  if (options.subtitle) {
    args.push('-subtitle', `"${options.subtitle}"`);
  }

  if (options.sound) {
    args.push('-sound', options.sound);
  }

  if (options.persistent) {
    args.push('-style', 'alert');
  }

  if (options.timeout) {
    args.push('-timeout', options.timeout.toString());
  }

  if (options.actions && options.actions.length > 0) {
    args.push('-actions', `"${options.actions.join(',')}"`);
  }

  if (options.openUrl) {
    args.push('-open', `"${options.openUrl}"`);
  }

  // 设置通知分组
  args.push('-group', 'claude-code-tasks');

  const command = `alerter ${args.join(' ')}`;
  await execAsync(command);
}

/**
 * 使用 osascript 发送通知（降级方案）
 */
async function sendOsascriptNotification(options: NotificationOptions): Promise<void> {
  const title = options.title.replace(/"/g, '\\"');
  const message = options.message.replace(/"/g, '\\"');
  const subtitle = options.subtitle?.replace(/"/g, '\\"') || '';
  const sound = options.sound || 'Glass';

  let script = `display notification "${message}" with title "${title}"`;
  if (subtitle) {
    script += ` subtitle "${subtitle}"`;
  }
  script += ` sound name "${sound}"`;

  await execAsync(`osascript -e '${script}'`);
}

/**
 * 发送任务完成通知
 */
export async function sendTaskNotification(status: TaskStatus): Promise<void> {
  const useAlerter = await isAlerterAvailable();

  const options: NotificationOptions = {
    title: 'Claude Code 任务完成',
    subtitle: `Agent: ${status.agentName}`,
    message: status.message || `任务耗时: ${Math.round(status.duration / 60)} 分钟`,
    sound: 'Glass',
    persistent: status.duration > 300, // 超过 5 分钟的任务使用持久化通知
    timeout: status.duration > 300 ? 0 : 10, // 持久化通知不自动关闭
  };

  if (useAlerter) {
    await sendAlerterNotification(options);
  } else {
    // 降级到 osascript
    await sendOsascriptNotification(options);
  }
}
```

### 7.2 安装 alerter

在项目 README 或安装文档中添加：

```markdown
## 安装依赖

### macOS 通知工具

为了获得更好的通知体验，建议安装 alerter：

\`\`\`bash
brew install alerter
\`\`\`

如果不安装 alerter，系统会自动降级使用 macOS 原生的 osascript。
```

### 7.3 配置选项

在 Master 配置文件中添加通知相关配置：

```toml
# ~/.task-master/config.toml

[notification]
# 通知声音
sound = "Glass"

# 是否启用声音
enable_sound = true

# 长任务阈值（秒），超过此时长使用持久化通知
long_task_threshold = 300

# 短任务通知超时时间（秒）
short_task_timeout = 10

# 是否在通知中显示项目路径
show_project_path = true
```

## 8. 常见问题和注意事项

### 8.1 权限问题

**问题**: 通知不显示或被阻止

**解决方案**:
1. 打开"系统设置" > "通知"
2. 找到"终端"或"Script Editor"
3. 确保"允许通知"已开启
4. 设置通知样式为"横幅"或"提醒"

### 8.2 勿扰模式

**问题**: 勿扰模式下通知不显示

**解决方案**:
```bash
# 使用 -ignoreDnD 参数忽略勿扰模式
alerter -title "紧急通知" \
        -message "重要任务完成" \
        -ignoreDnD
```

### 8.3 通知分组

**问题**: 通知太多，通知中心很乱

**解决方案**:
```bash
# 使用 -group 参数将相关通知分组
alerter -title "构建完成" \
        -message "项目 A 构建成功" \
        -group "build-notifications"

alerter -title "构建完成" \
        -message "项目 B 构建成功" \
        -group "build-notifications"
```

相同 group 的通知会合并显示。

### 8.4 返回值处理

**问题**: 如何正确处理用户的操作结果

**解决方案**:
```bash
# alerter 的返回值说明:
# - @TIMEOUT: 通知超时
# - @CLOSED: 用户关闭通知
# - @CONTENTIMAGE: 用户点击通知内容
# - @ACTIONCLICKED: 用户点击操作按钮（返回按钮文本）
# - 其他: 用户输入的文本或选择的下拉项

RESULT=$(alerter -title "确认" \
                 -message "是否继续？" \
                 -actions "确定,取消" \
                 -timeout 30)

case "$RESULT" in
  "@TIMEOUT")
    echo "用户未响应，超时"
    ;;
  "@CLOSED")
    echo "用户关闭了通知"
    ;;
  "确定")
    echo "用户点击了确定"
    ;;
  "取消")
    echo "用户点击了取消"
    ;;
esac
```

### 8.5 性能考虑

**问题**: 频繁发送通知会影响性能吗？

**建议**:
- alerter 启动速度很快（~50ms），适合频繁调用
- 如果需要批量发送通知，考虑使用通知分组
- 避免在循环中同步调用，使用异步或批处理

### 8.6 兼容性

**支持的 macOS 版本**:
- macOS 10.10 (Yosemite) 及以上
- 推荐 macOS 11 (Big Sur) 及以上以获得最佳体验

### 8.7 调试技巧

```bash
# 查看 alerter 版本
alerter --version

# 测试基本通知
alerter -message "测试通知"

# 查看详细输出（使用 -json 参数）
alerter -title "测试" \
        -message "测试消息" \
        -actions "确定,取消" \
        -json

# 输出示例:
# {"activationType":"actionClicked","activationValue":"确定"}
```

## 9. 参考资源

- **GitHub 仓库**: https://github.com/vjeantet/alerter
- **macOS 通知中心文档**: https://developer.apple.com/documentation/usernotifications
- **系统声音列表**: `/System/Library/Sounds/`

## 10. 总结

alerter 是目前 macOS 上功能最强大的命令行通知工具，特别适合需要用户交互的场景。对于 claude-hook-notify 项目：

**推荐使用 alerter 的理由**:
1. 支持持久化通知，长任务完成后不会错过
2. 可以添加操作按钮，未来可扩展更多交互功能
3. 通知分组功能，避免通知中心混乱
4. 项目活跃，持续维护

**实施建议**:
1. 优先使用 alerter，不可用时降级到 osascript
2. 根据任务时长选择通知类型（短任务用横幅，长任务用持久化）
3. 使用通知分组，所有 Claude Code 任务通知归为一组
4. 在文档中说明 alerter 的安装方法和优势
