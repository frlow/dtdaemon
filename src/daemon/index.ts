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

let busy = false
const app = new Elysia()
    .get('/', ({set}) => {
      set.status = busy ? 503 : !!getSettings().domain ? 200 : 204
    })
    .get('/busy', async () => {
      while(busy) await Bun.sleep(50)
    })
    .get('/settings', ({set}) => {
      set.headers = {
        'content-type': 'application/json',
      }
      return JSON.stringify(getSettings())
    })
    .post(
        '/settings',
        ({set, body}) => {
          saveSettings(body as Settings)
          set.status = 200
        },
        {type: 'application/json'},
    )
    .get('/apps', async ({set}) => {
      set.headers = {
        'content-type': 'application/json',
      }
      return JSON.stringify(await listApps())
    })
    .get('/apps/:id', async ({set, params}) => {
      set.headers = {
        'content-type': 'application/json',
      }
      return JSON.stringify(await getAppMetadata(params.id))
    })
    .get('/apps/:id/logo', async ({ params}) => {
      return JSON.stringify(await getAppLogo(params.id))
    })
    .post(
        '/apps/:id',
        async ({params, body}) => await installApp(params.id, body as any),
        {type: 'application/json'},
    )
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
                console.log(next)
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
    .post('/update', async () => {
      if(busy) return new Response(undefined,{status: 503})
      return new Response(
          new ReadableStream({
            type: 'direct',
            async pull(controller: ReadableStreamDirectController) {
              busy = true
              await dockerInstall(await getConfig(), (msg) => {
                console.log(msg)
                controller.write(msg)
                controller.flush()
              }).catch(()=>{busy=false})
              controller.close()
              busy = false
            },
          }),
          {status: 200, headers: {'Content-Type': 'text/event-stream'}},
      )
    })
    .post('/pull', async () => {
      if(busy) return new Response(undefined,{status: 503})
      return new Response(
          new ReadableStream({
            type: 'direct',
            async pull(controller: ReadableStreamDirectController) {
              busy = true
              await dockerPull(await getConfig(), (msg) => {
                console.log(msg)
                controller.write(msg)
                controller.flush()
              }).catch(()=>{busy=false})
              controller.close()
              busy = false
            },
          }),
          {status: 200, headers: {'Content-Type': 'text/event-stream'}},
      )
    })
    .delete('/apps/:id', async ({params}) => await removeApp(params.id))
    .listen(8466)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
