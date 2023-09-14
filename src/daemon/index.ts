import { Elysia } from 'elysia'
import { getConfig, getSettings, saveSettings } from './config'
import { Settings } from '../types/Settings'
import {
  getAppLogo,
  getAppMetadata,
  installApp,
  listApps,
  removeApp,
} from './apps'
import { dockerInstall, dockerLog, dockerPull } from './docker'

const app = new Elysia()
  .get('/', ({ set }) => {
    set.status = !!getSettings().domain ? 200 : 204
  })
  .get('/settings', ({ set }) => {
    set.headers = {
      'content-type': 'application/json',
    }
    return JSON.stringify(getSettings())
  })
  .post(
    '/settings',
    ({ set, body }) => {
      saveSettings(body as Settings)
      set.status = 200
    },
    { type: 'application/json' },
  )
  .get('/apps', async ({ set }) => {
    set.headers = {
      'content-type': 'application/json',
    }
    return JSON.stringify(await listApps())
  })
  .get('/apps/:id', async ({ set, params }) => {
    set.headers = {
      'content-type': 'application/json',
    }
    return JSON.stringify(await getAppMetadata(params.id))
  })
  .get('/apps/:id/logo', async ({ set, params }) => {
    return JSON.stringify(await getAppLogo(params.id))
  })
  .post(
    '/apps/:id',
    async ({ params, body }) => await installApp(params.id, body as any),
    { type: 'application/json' },
  )
  .get('/apps/:id/log', async ({ request, params }) => {
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
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  })
  .post('/update', async ({ request }) => {
    return new Response(
      new ReadableStream({
        type: 'direct',
        async pull(controller: ReadableStreamDirectController) {
          await dockerInstall(await getConfig(), (msg) => {
            controller.write(msg)
            controller.flush()
          })
          controller.close()
        },
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  })
  .post('/pull', async ({ request }) => {
    return new Response(
      new ReadableStream({
        type: 'direct',
        async pull(controller: ReadableStreamDirectController) {
          await dockerPull(await getConfig(), (msg) => {
            controller.write(msg)
            controller.flush()
          })
          controller.close()
        },
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  })
  .delete('/apps/:id', async ({ params }) => await removeApp(params.id))
  .listen(8466)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
