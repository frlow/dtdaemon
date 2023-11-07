import {Elysia} from 'elysia'
import {getConfig, getSettings, saveSettings} from './config'
import {Settings} from '../types/Settings'
import {
  getAppLogo,
  getAppMetadata,
  installApp,
  listApps,
  removeApp,
} from './apps'
import {dockerInstall, dockerLog, dockerPull} from './docker'

const logListeners: ((msg: string) => void)[] = []
const log: string[] = []
const appendToLog = (msg: string) => {
  if (log.length > 1000) log.shift()
  log.push(msg)
  while (logListeners.length > 0) {
    const ll = logListeners.shift()
    if (!ll) break
    ll(msg)
  }
}

const queue: (() => Promise<void>)[] = []
let queueStarter: (() => void) | undefined
const startQueue = async () => {
  while (true) {
    if (queue.length === 0) await new Promise((r: any) => queueStarter = r)
    queueStarter = undefined
    const current = queue.shift()
    if (!current) continue
    await current().catch(e=>appendToLog(e))
  }
}
startQueue().then()
const appendToQueue = (func: () => Promise<any>) => {
  queue.push(func)
  if (queueStarter) queueStarter()
}


const app = new Elysia()
    // Check if daemon is available and ready
    .get('/', ({set}) => {
      set.status = getSettings().domain ? 200 : 204
    })

    // Get and update settings
    .get('/settings', ({set}) => {
      set.headers = {
        'content-type': 'application/json',
      }
      return JSON.stringify({...getSettings(), password: undefined})
    })
    .post(
        '/settings',
        ({set, body}) => {
          saveSettings(body as Settings)
          set.status = 200
        },
        {type: 'application/json'},
    )

    // List apps
    .get('/apps', async ({set}) => {
      set.headers = {
        'content-type': 'application/json',
      }
      const apps = Object.entries(
          await listApps()).map(([name, value]) =>
          ({name, ...value}))
      apps.sort((a, b) => a.name.localeCompare(b.name))
      return JSON.stringify(apps)
    })

    // App metadata
    .get('/apps/:id', async ({set, params}) => {
      set.headers = {
        'content-type': 'application/json',
      }
      return JSON.stringify(await getAppMetadata(params.id))
    })

    // App logo
    .get('/apps/:id/logo', async ({params}) => {
      return JSON.stringify(await getAppLogo(params.id))
    })

    // Install and uninstall apps
    .post(
        '/apps/:id',
        async ({params, body}) => await installApp(params.id, body as any),
        {type: 'application/json'},
    )
    .delete('/apps/:id', async ({params}) => await removeApp(params.id))

    // Get app log
    .get('/apps/:id/log', async ({request, params}) => {
      const log = dockerLog(await getConfig(), params.id)
      request.signal.addEventListener('abort', () => log.close())
      return new Response(
          new ReadableStream({
            type: 'direct',
            async pull(controller: ReadableStreamDirectController) {
              while (true) {
                const next = await log.next()
                if (!next) break
                controller.write(next)
                controller.flush()
                await Bun.sleep(1000)
              }
              controller.close()
            },
          }),
          {status: 200, headers: {'Content-Type': 'text/event-stream'}},
      )
    })

    // Update install state, perform install and uninstall
    .post('/update', async () => {
      const config = await getConfig()
      appendToQueue(async () => await dockerInstall(config, appendToLog))
    })

    // Pull all images
    .post('/pull', async () => {
      const config = await getConfig()
      appendToQueue(async () => await dockerPull(config, appendToLog))
    })

    // Server log
    .get("/log", ({request}) => {
      request.signal.addEventListener('abort', () => done = true)
      let done = false
      return new Response(
          new ReadableStream({
            type: 'direct',
            async pull(controller: ReadableStreamDirectController) {
              controller.write("Hello!")
              controller.flush()
              controller.write(log.join("\n"))
              controller.flush()
              while (!done) {
                const logLine = await new Promise((r: (msg: string) => void) => logListeners.push(r))
                controller.write(logLine)
                controller.flush()
              }
              controller.close()
            },
          }),
          {status: 200, headers: {'Content-Type': 'text/event-stream'}},
      )
    })
    .listen(8466)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
