#!/bin/bash

# 任务状态模拟器
# 用于测试 Task Master 守护进程

STATUS_DIR="$HOME/.task-status"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 创建状态目录
mkdir -p "$STATUS_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Task Master 测试模拟器${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查守护进程是否运行
if pgrep -f "tsx.*cli.ts" > /dev/null || pgrep -f "node.*cli.js" > /dev/null; then
    echo -e "${GREEN}✓ 守护进程正在运行${NC}"
else
    echo -e "${YELLOW}⚠ 警告: 守护进程未运行${NC}"
    echo -e "${YELLOW}  请先运行: pnpm dev${NC}"
    echo ""
fi

# 生成 UUID 的简单函数
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen
    else
        # 简单的 UUID 生成器 (fallback)
        echo "$(date +%s%N)-$(hostname)-$$"
    fi
}

# 模拟任务完成
simulate_completed() {
    local agent_name="test-agent-$(date +%s)"
    local task_id=$(generate_uuid)
    local timestamp=$(date +%s)000
    local duration=$((5 + RANDOM % 60))

    cat > "$STATUS_DIR/${task_id}.json" <<EOF
{
  "agentName": "$agent_name",
  "taskId": "$task_id",
  "status": "completed",
  "message": "测试任务: 代码审查完成",
  "timestamp": $timestamp,
  "duration": $duration,
  "workingDir": "/Users/zhangziheng/Documents/github/claude-hook-notify"
}
EOF

    echo -e "${GREEN}✓ 已创建任务完成状态文件${NC}"
    echo -e "  Agent: ${agent_name}"
    echo -e "  Task ID: ${task_id}"
    echo -e "  Duration: ${duration}s"
}

# 模拟任务等待
simulate_waiting() {
    local agent_name="claude-agent"
    local task_id=$(generate_uuid)
    local timestamp=$(date +%s)000
    local duration=$((30 + RANDOM % 120))

    cat > "$STATUS_DIR/${task_id}.json" <<EOF
{
  "agentName": "$agent_name",
  "taskId": "$task_id",
  "status": "waiting",
  "message": "等待用户输入: 请确认是否继续",
  "timestamp": $timestamp,
  "duration": $duration,
  "workingDir": "/Users/zhangziheng/Documents/test-project"
}
EOF

    echo -e "${YELLOW}✓ 已创建任务等待状态文件${NC}"
    echo -e "  Agent: ${agent_name}"
    echo -e "  Task ID: ${task_id}"
    echo -e "  Message: 等待用户输入"
}

# 模拟任务错误
simulate_error() {
    local agent_name="build-agent"
    local task_id=$(generate_uuid)
    local timestamp=$(date +%s)000
    local duration=$((10 + RANDOM % 30))

    cat > "$STATUS_DIR/${task_id}.json" <<EOF
{
  "agentName": "$agent_name",
  "taskId": "$task_id",
  "status": "error",
  "message": "构建失败: TypeScript 类型错误",
  "timestamp": $timestamp,
  "duration": $duration,
  "workingDir": "/Users/zhangziheng/Documents/github/failing-project"
}
EOF

    echo -e "${RED}✓ 已创建任务错误状态文件${NC}"
    echo -e "  Agent: ${agent_name}"
    echo -e "  Task ID: ${task_id}"
    echo -e "  Error: 构建失败"
}

# 批量模拟任务
simulate_batch() {
    local count=$1
    echo -e "${BLUE}正在批量创建 ${count} 个测试任务...${NC}"
    echo ""

    for i in $(seq 1 $count); do
        case $((RANDOM % 3)) in
            0) simulate_completed ;;
            1) simulate_waiting ;;
            2) simulate_error ;;
        esac
        sleep 0.5
    done

    echo ""
    echo -e "${GREEN}✓ 批量创建完成${NC}"
}

# 显示当前状态文件
show_status_files() {
    echo -e "${BLUE}当前状态目录中的文件:${NC}"
    if [ "$(ls -A $STATUS_DIR 2>/dev/null)" ]; then
        ls -lh "$STATUS_DIR" | grep "\.json$" | awk '{print "  " $9 " (" $5 ")"}'
        local count=$(ls -1 "$STATUS_DIR"/*.json 2>/dev/null | wc -l)
        echo -e "  总计: ${count} 个文件"
    else
        echo -e "  (空)"
    fi
}

# 清理状态文件
cleanup() {
    echo -e "${YELLOW}清理状态文件...${NC}"
    rm -f "$STATUS_DIR"/*.json
    echo -e "${GREEN}✓ 已清理所有状态文件${NC}"
}

# 显示菜单
show_menu() {
    echo ""
    echo -e "${BLUE}请选择操作:${NC}"
    echo "  1) 模拟任务完成 (completed)"
    echo "  2) 模拟任务等待 (waiting)"
    echo "  3) 模拟任务错误 (error)"
    echo "  4) 批量创建任务 (5个)"
    echo "  5) 批量创建任务 (10个)"
    echo "  6) 显示当前状态文件"
    echo "  7) 清理所有状态文件"
    echo "  8) 连续监控模式 (每3秒创建一个任务)"
    echo "  0) 退出"
    echo ""
}

# 连续监控模式
continuous_mode() {
    echo -e "${BLUE}进入连续监控模式 (Ctrl+C 退出)${NC}"
    echo ""

    trap 'echo -e "\n${YELLOW}已退出监控模式${NC}"; exit 0' INT

    local i=1
    while true; do
        echo -e "[${i}] $(date '+%H:%M:%S') - 创建测试任务..."
        case $((RANDOM % 3)) in
            0) simulate_completed ;;
            1) simulate_waiting ;;
            2) simulate_error ;;
        esac
        ((i++))
        sleep 3
    done
}

# 主循环
main() {
    if [ "$1" = "--continuous" ]; then
        continuous_mode
        exit 0
    fi

    while true; do
        show_menu
        read -p "请输入选项 [0-8]: " choice

        case $choice in
            1)
                echo ""
                simulate_completed
                ;;
            2)
                echo ""
                simulate_waiting
                ;;
            3)
                echo ""
                simulate_error
                ;;
            4)
                echo ""
                simulate_batch 5
                ;;
            5)
                echo ""
                simulate_batch 10
                ;;
            6)
                echo ""
                show_status_files
                ;;
            7)
                echo ""
                cleanup
                ;;
            8)
                echo ""
                continuous_mode
                ;;
            0)
                echo ""
                echo -e "${GREEN}再见!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项,请重试${NC}"
                ;;
        esac
    done
}

# 运行主程序
main
