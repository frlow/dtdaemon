import {getAppDirectory} from './appDirectory'
import {getSettings, getInstalledApps, saveInstalledApps} from './config'
import {Variables} from '../types/Variables'

export const listApps = async (): Promise<Record<string, {installed: boolean, service: boolean}>> => {
  const settings = getSettings()
  debugger
  const installedApps = getInstalledApps()
  const appDir = await getAppDirectory(settings.appDirectory)
  const appNames = Object.keys(appDir)
  return appNames.reduce(
      (acc, cur) => ({
        ...acc, [cur]: {
          installed: !!installedApps[cur],
          service: !appDir[cur].ingresses
        }
      }),
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
  console.log(getSettings())
  const app = {
    ...(await getAppDirectory(getSettings().appDirectory))[name],
    installed: !!getInstalledApps()[name]
  }
  delete app.logoImage
  return app
}

export const getAppLogo = async (name: string) =>
    (await getAppDirectory(getSettings().appDirectory))[name].logoImage || ''
