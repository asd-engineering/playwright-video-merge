import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  banner({ format }) {
    if (format === 'esm') {
      return {
        // Allow CLI to run as executable
        js: '',
      };
    }
    return {};
  },
  onSuccess: 'chmod +x dist/cli.js 2>/dev/null || true',
});
