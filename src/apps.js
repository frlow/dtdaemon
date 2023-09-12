import { getInstalledApps, saveInstalledApps } from './installedApps.js'
import { getAppDirectory } from './appDirectory.js'
import { getSettings } from './settings.js'

/**
 *
 * @returns {Promise<Record<string, boolean>>}
 */
export const listApps = async () => {
  const settings = getSettings()
  const installedApps = getInstalledApps()
  const appNames = Object.keys(await getAppDirectory(settings.appDirectory))
  return appNames.reduce(
    (acc, cur) => ({ ...acc, [cur]: !!installedApps[cur] }),
    {},
  )
}

/**
 *
 * @param {string} name
 * @param {Record<string,string>} [variables]
 * @returns {Promise<void>}
 */
export const installApp = async (name, variables) =>
  saveInstalledApps({ ...getInstalledApps(), [name]: variables || {} })

/**
 *
 * @param {string} name
 * @returns {Promise<void>}
 */
export const removeApp = async (name) => {
  const temp = getInstalledApps()
  delete temp[name]
  saveInstalledApps(temp)
}

/**
 *
 * @param {string} name
 * @returns {Promise<import('./types/AppDirectory.js').AppConfig>}
 */
export const getAppMetadata = async (name) => {
  const app = { ...(await getAppDirectory(getSettings().appDirectory))[name] }
  delete app.logoImage
  return app
}

/**
 *
 * @param {string} name
 * @returns {Promise<string>}
 */
export const getAppLogo = async (name) =>
  (await getAppDirectory(getSettings().appDirectory))[name].logoImage || ''
