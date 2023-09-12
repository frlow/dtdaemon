import { rmSync } from 'node:fs'
import fs from 'fs'
import path from 'path'
import { loadApps } from './src/appsFile.js'
import { execCommand } from './src/exec.js'

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

fs.writeFileSync(
  path.join('./appDirectory.json'),
  JSON.stringify(loadApps(), null, 2),
  'utf8',
)

await Bun.build({
  entrypoints: ['src/daemon.js'],
  minify: true,
  outdir: distDir,
})

await execCommand('docker buildx build -t lowet84/dtdaemon .')

rmSync('./dist', { recursive: true })
