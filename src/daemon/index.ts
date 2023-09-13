import { Elysia } from 'elysia'
import { getSettings, saveSettings } from './config'
import { Settings } from '../types/Settings'
import { getAppLogo, getAppMetadata, listApps } from './apps'

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
  .listen(8466)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
