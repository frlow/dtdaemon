import { Elysia } from 'elysia'
import { getSettings, saveSettings } from './config'
import { Settings } from '../types/Settings'

const app = new Elysia()
  .get('/', ({ set }) => {
    set.status = !!getSettings() ? 200 : 204
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
  .listen(8466)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
