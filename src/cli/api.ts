import { Settings } from '../types/Settings'
import { AppConfig } from '../types/AppDirectory'

export const daemonHostUrl = 'http://127.0.0.1:8466'

export const pull = async () => {
  debugger
  throw 'N/A'
}

export const log = async (name: string) => {
  debugger
  throw 'N/A'
}

export const update = async (): Promise<string> => {
  debugger
  throw 'N/A'
}

export const removeApp = async (name: string) => {
  debugger
  throw 'N/A'
}

export const installApp = async (
  name: string,
  variables: Record<string, string>,
) =>
  await fetch(`${daemonHostUrl}/apps/${name}`, {
    method: 'PUSH',
    body: JSON.stringify(variables),
  })

export const getAppLogo = async (name: string) =>
  await fetch(`${daemonHostUrl}/apps/${name}/logo`).then((r) => r.text())

export const listApps = async (): Promise<Record<string, boolean>> =>
  await fetch(`${daemonHostUrl}/apps`).then((r) => r.json())

export const getAppMetadata = async (name: string): Promise<AppConfig> =>
  await fetch(`${daemonHostUrl}/apps/${name}`).then((r) => r.json())

export const getSettings = async (): Promise<Settings> =>
  await fetch(`${daemonHostUrl}/settings`).then((r) => r.json())

export const saveSettings = async (settings: Settings) => {
  await fetch(`${daemonHostUrl}/settings`, {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}
