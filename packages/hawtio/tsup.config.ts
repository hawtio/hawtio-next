import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/init.ts', 'src/ui/index.ts'],
  target: 'esnext',
  dts: true,
  sourcemap: true,
  format: 'cjs',
  splitting: true,
  loader: {
    '.svg': 'dataurl',
    '.jpg': 'dataurl',
    '.png': 'dataurl',
    '.md': 'text',
  },
})
