import * as fs from 'fs'
import * as path from 'path'
import { Settings } from '../types/Settings'
import { Client } from '../api'
import { execCommand } from '../exec'

export const buildImages = async () => {
  await buildAuthImage()
  await buildDaemonImage()
}

export const init = async (client: Client, settings: Settings) => {
  if (!(await client.status())) {
    await buildImages()
    await execCommand('docker network create dtdaemon')
    await execCommand('docker rm -f dtdaemon')
    await execCommand(
      `docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 8466:8466 --net dtdaemon --name dtdaemon dtdaemon`,
    )
    while (true) {
      console.log('Connecting to daemon...')
      if (await client.status()) break
      await new Promise((r) => setTimeout(() => r(''), 1000))
    }
  }
  await client.saveSettings(settings)
}

const buildDockerImage = async (
  dockerfile: string,
  entry: string,
  image: string,
) => {
  const tempdir = path.join(process.cwd(), 'dockertemp')
  if (fs.existsSync(tempdir)) fs.rmSync(tempdir, { recursive: true })
  fs.mkdirSync(tempdir)
  fs.writeFileSync(path.join(tempdir, 'Dockerfile'), dockerfile, 'utf8')
  const code = await Bun.build({
    entrypoints: [entry],
    target: 'bun',
    minify: false,
  }).then((r) => r.outputs[0].text())
  fs.writeFileSync(path.join(tempdir, 'index.js'), code, 'utf8')
  await execCommand(`cd ${tempdir} && docker buildx build -t ${image} .`).result
  fs.rmSync(tempdir, { recursive: true })
}

const buildAuthImage = async () => {
  const dockerfile = `FROM oven/bun
ADD index.js /index.js
WORKDIR /
EXPOSE 3000
CMD bun run /index.js`
  const entry = path.join(import.meta.path, '..', '..', 'login', 'index.ts')
  const image = 'simple-auth'
  await buildDockerImage(dockerfile, entry, image)
}

const buildDaemonImage = async () => {
  const dockerfile = `FROM oven/bun
RUN apt update && \\
    apt install -y curl && \\
    curl -fsSL https://get.docker.com/ | sh
COPY index.js /index.js
WORKDIR /
CMD bun /index.js
`
  const entry = path.join(import.meta.path, '..', '..', 'daemon', 'index.ts')
  const image = 'dtdaemon'
  await buildDockerImage(dockerfile, entry, image)
}
