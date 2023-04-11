import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/util/index.ts'],
  dts: true,
  sourcemap: true,
  loader: {
    '.svg': 'dataurl',
    '.jpg': 'dataurl',
    '.md': 'text',
  },
})
