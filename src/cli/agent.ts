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
