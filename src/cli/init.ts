import * as fs from 'fs'
import * as path from 'path'
import { loginServer } from './loginServer.js'
import { execCommand } from '../exec'
import { Settings } from '../types/Settings'
import { daemonHostUrl, saveSettings } from './api'

export const daemonStatus = async () =>
  (await fetch(daemonHostUrl).catch(() => undefined))?.status

export const init = async (settings: Settings) => {
  if (!(await daemonStatus())) {
    await execCommand('docker network create dtdaemon')
    await execCommand('docker rm -f dtdaemon')
    await execCommand(
      `docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 8466:8466 --net dtdaemon --name dtdaemon lowet84/dtdaemon`,
    )
    while (true) {
      console.log('Connecting to daemon...')
      if (!(await daemonStatus())) break
      await new Promise((r) => setTimeout(() => r(''), 1000))
    }
  }
  await saveSettings(settings)
}

export const buildAuthImage = async () => {
  const tempdir = './dockertemp'
  if (fs.existsSync(tempdir)) fs.rmSync(tempdir, { recursive: true })
  fs.mkdirSync(tempdir)
  fs.writeFileSync(
    path.join(tempdir, 'Dockerfile'),
    `FROM oven/bun\nADD index.js /index.js\nWORKDIR /\n\EXPOSE 3000\nCMD bun run /index.js`,
    'utf8',
  )
  fs.writeFileSync(path.join(tempdir, 'index.ts'), atob(loginServer), 'utf8')
  await execCommand(`cd ${tempdir} && docker buildx build -t simple-auth .`)
  fs.rmSync('./dockertemp', { recursive: true })
}
