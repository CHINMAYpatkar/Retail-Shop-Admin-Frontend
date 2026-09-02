import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest rather than Jest: this is a Vite-compatible toolchain, `@/` aliases
 * resolve from tsconfig natively, and there is no Babel config to maintain.
 *
 * `.mts` so the config is loaded as ESM - a `.ts` config here is read as
 * CommonJS and warns on every run.
 *
 * The default environment is Node. Specs needing a DOM opt in per-file with
 * `// @vitest-environment jsdom`, so pure-logic specs stay fast.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: ['src/test/**', '**/*.d.ts', '.next/**'],
    },
  },
});
