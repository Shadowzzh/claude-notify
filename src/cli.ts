#!/usr/bin/env node
import { Command } from 'commander';
import { agentCommands } from './agent/commands/index.js';
import { masterCommands } from './master/commands/index.js';

const program = new Command();

program.name('ccnotify').description('Claude Code 分布式任务完成通知系统').version('1.0.0');

const agent = program.command('agent').description('Agent 命令 (远程机器)');
agentCommands(agent);

const master = program.command('master').description('Master 命令 (本地机器)');
masterCommands(master);

program.parse();
