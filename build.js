import { rmSync } from 'node:fs'
import fs from 'fs'
import path from 'path'
import { loadApps } from './src/appsFile.js'

const distDir = './dist'
await Bun.build({
  entrypoints: ['src/loginServer/index.ts'],
  minify: true,
  outdir: distDir,
})
const code = btoa(await Bun.file('./dist/index.js').text())
await Bun.write(
  './src/loginServer.js',
  `/** @type {string} */export const loginServer = \`${code}\``,
)
rmSync('./dist', { recursive: true })

fs.writeFileSync(
  path.join('./appDirectory.json'),
  JSON.stringify(loadApps(), null, 2),
  'utf8',
)
