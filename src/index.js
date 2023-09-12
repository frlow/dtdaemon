import { getSettings } from './settings.js'
import { dockerInstall } from './docker.js'
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

/**
 *
 * @param {(msg: string)=>void} [log]
 * @returns {Promise<void>}
 */
export const update = async (log) => {
  await buildAuthImage()
  const settings = getSettings()
  const installedApps = getInstalledApps()
  const appDirectory = await getAppDirectory(settings.appDirectory)
  await dockerInstall(
    {
      settings,
      appDirectory,
      installedApps,
    },
    log || console.log,
  )
}
