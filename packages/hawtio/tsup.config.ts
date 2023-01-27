import { defineConfig } from 'tsup'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  dts: true,
  sourcemap: true,
  clean: true,
  loader: {
    '.svg': 'file',
    '.jpg': 'file',
    '.md': 'text'
  },
})
