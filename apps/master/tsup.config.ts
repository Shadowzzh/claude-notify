import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/install-service.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['@task/shared', 'pino', 'chokidar', 'proper-lockfile', 'cac'],
});
