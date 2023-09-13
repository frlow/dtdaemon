import { rmSync } from 'node:fs'
import fs from 'fs'
import path from 'path'
import { loadApps } from './src/daemon/appsFile'
import { execCommand } from './src/exec.js'

const distDir = './dist'
await Bun.build({
  entrypoints: ['src/loginServer/index.ts'],
  minify: true,
  outdir: distDir,
  target: 'bun',
})
const code = btoa(await Bun.file('./dist/index.js').text())
await Bun.write(
  './src/cli/loginServer.ts',
  `export const loginServer: string = \`${code}\``,
)

fs.writeFileSync(
  path.join('./appDirectory.json'),
  JSON.stringify(loadApps(), null, 2),
  'utf8',
)

await Bun.build({
  entrypoints: ['src/daemon.ts'],
  minify: true,
  outdir: distDir,
  target: 'bun',
})

await execCommand('docker buildx build -t lowet84/dtdaemon .')

rmSync('./dist', { recursive: true })
