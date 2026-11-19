import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built demo works under any path, such as
  // GitHub Pages' /flex-reports/.
  base: './',
  server: {
    host: 'localhost',
    port: 6060,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Every source file counts, including ones no test loads.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
      // About a point under today's numbers: CI fails if coverage drops.
      thresholds: { statements: 92, branches: 89, functions: 92, lines: 93 },
    },
  },
})
