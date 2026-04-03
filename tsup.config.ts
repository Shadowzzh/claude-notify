import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/agent.ts', 'src/cli/master.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
});
