import { dockerInstall, dockerLog, dockerPull } from './docker.js'
import { getAppDirectory } from './appDirectory.js'
import { buildAuthImage } from './init.js'
import { getInstalledApps, getSettings } from './config.js'

export { getSettings, saveSettings } from './config.js'
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
  await await buildAuthImage()
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
