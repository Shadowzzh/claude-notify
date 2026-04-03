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
