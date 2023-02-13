import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  sourcemap: true,
  entry: ['src/index.ts'],
})
