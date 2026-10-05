import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/backend/main.ts', 'src/backend/app.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist/backend'
});
