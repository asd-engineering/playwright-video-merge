import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    outDir: 'dist',
    onSuccess: 'chmod +x dist/cli.js 2>/dev/null || true',
  },
]);
