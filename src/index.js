import { getSettings } from './settings.js'
import { dockerInstall, dockerLog, dockerPull } from './docker.js'
import { getAppDirectory } from './appDirectory.js'
import { getInstalledApps } from './installedApps.js'
import { buildAuthImage } from './init.js'

export { getSettings, saveSettings } from './settings.js'
export {
  removeApp,
  installApp,
  listApps,
  getAppMetadata,
  getAppLogo,
} from './apps.js'

const getConfig = async () => {
  const settings = getSettings()
  const installedApps = getInstalledApps()
  const appDirectory = await getAppDirectory(settings.appDirectory)
  return {
    settings,
    appDirectory,
    installedApps,
  }
}

/**
 *
 * @param {(msg: string)=>void} [log]
 * @returns {Promise<void>}
 */
export const update = async (log) => {
  await buildAuthImage()

  await dockerInstall(await getConfig(), log || console.log)
}

/**
 *
 * @param {(msg: string)=>void} [log]
 * @returns {Promise<void>}
 */
export const pull = async (log) =>
  dockerPull(await getConfig(), log || console.log)

/**
 *
 * @param {string} id
 * @param {(msg: string)=>void} [log]
 * @returns {Promise<void>}
 */
export const log = async (id, log) =>
  dockerLog(await getConfig(), id, log || console.log)
