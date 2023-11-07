import { Settings } from './types/Settings'
import { AppConfig } from './types/AppDirectory'
import { Log } from './types/Log'

export type Client = ReturnType<typeof createClient>
export const createClient = (daemonHostUrl: string) => ({
  status: async () =>
    (await fetch(daemonHostUrl).catch(() => undefined))?.status as number,
  pull: async () => {
    await fetch(`${daemonHostUrl}/pull`, { method: 'POST' })
  },

  appLog: async (name: string, log: Log) => {
    const response = await fetch(`${daemonHostUrl}/apps/${name}/log`)
    const reader = response.body?.getReader()
    if (!reader) return undefined
    ;(async () => {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        log(Buffer.from(value).toString('utf8'))
      }
    })()
    return () => reader.cancel()
  },

  update: async () => {
    await fetch(`${daemonHostUrl}/update`, { method: 'POST' })
  },

  removeApp: async (name: string) =>
    await fetch(`${daemonHostUrl}/apps/${name}`, {
      method: 'DELETE',
    }),

  installApp: async (name: string, variables: Record<string, string>) =>
    await fetch(`${daemonHostUrl}/apps/${name}`, {
      method: 'POST',
      body: JSON.stringify(variables),
    }),

  getAppLogo: async (name: string) =>
    await fetch(`${daemonHostUrl}/apps/${name}/logo`).then((r) => r.text()),

  listApps: async (): Promise<{installed: boolean, service: boolean, name: string}[]> =>
    await fetch(`${daemonHostUrl}/apps`).then((r) => r.json()),

  getAppMetadata: async (name: string): Promise<AppConfig> =>
    await fetch(`${daemonHostUrl}/apps/${name}`).then((r) => r.json()),

  getSettings: async (): Promise<Settings> =>
    await fetch(`${daemonHostUrl}/settings`).then((r) => r.json()),

  saveSettings: async (settings: Settings) => {
    await fetch(`${daemonHostUrl}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  },
})
