import * as fs from 'fs'
import * as path from 'path'
import { loginServer } from './loginServer.js'
import { execCommand } from './exec.js'

export const buildAuthImage = async () => {
  if (
    (
      await execCommand('docker image ls | grep simple-auth', () => {})
    ).includes('simple-auth')
  )
    return

  const tempdir = './dockertemp'
  fs.mkdirSync(tempdir)
  fs.writeFileSync(
    path.join(tempdir, 'Dockerfile'),
    `FROM oven/bun\nADD index.js /index.js\nWORKDIR /\n\EXPOSE 3000\nCMD bun run /index.js`,
    'utf8',
  )
  fs.writeFileSync(path.join(tempdir, 'index.js'), atob(loginServer), 'utf8')
  await execCommand(`cd ${tempdir} && docker buildx build -t simple-auth .`)
  fs.rmSync('./dockertemp', { recursive: true })
}
