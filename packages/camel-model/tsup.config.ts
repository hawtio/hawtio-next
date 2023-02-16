import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  sourcemap: false,
  entry: ['src/index.ts'],
})
