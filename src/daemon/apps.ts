import {getAppDirectory} from './appDirectory'
import {getSettings, getInstalledApps, saveInstalledApps} from './config'
import {Variables} from '../types/Variables'

export const listApps = async (): Promise<Record<string, boolean>> => {
  const settings = getSettings()
  debugger
  const installedApps = getInstalledApps()
  const appNames = Object.keys(await getAppDirectory(settings.appDirectory))
  return appNames.reduce(
      (acc, cur) => ({...acc, [cur]: !!installedApps[cur]}),
      {},
  )
}

export const installApp = async (name: string, variables: Variables) =>
    saveInstalledApps({...getInstalledApps(), [name]: variables || {}})

export const removeApp = async (name: string) => {
  const temp = getInstalledApps()
  delete temp[name]
  saveInstalledApps(temp)
}

export const getAppMetadata = async (name: string) => {
  const app = {
    ...(await getAppDirectory(getSettings().appDirectory))[name],
    installed: !!getInstalledApps()[name]
  }
  delete app.logoImage
  return app
}

export const getAppLogo = async (name: string) =>
    (await getAppDirectory(getSettings().appDirectory))[name].logoImage || ''
