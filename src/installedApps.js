import fs from 'fs'
import path from 'path'

/**
 * @typedef {Record<string, Record<string, string>>} InstalledApps
 */

const installedAppsPath = './config/apps.json'

/**
 * @returns {InstalledApps}
 */
export const getInstalledApps = () =>
  JSON.parse(fs.readFileSync(installedAppsPath, 'utf8'))

/**
 *
 * @param {InstalledApps} installedApps
 */
export const saveInstalledApps = (installedApps) => {
  if (!fs.existsSync(path.dirname(installedAppsPath)))
    fs.mkdirSync(path.dirname(installedAppsPath))
  if (!fs.existsSync(installedAppsPath))
    fs.writeFileSync(installedAppsPath, '{}', 'utf8')
  fs.writeFileSync(
    installedAppsPath,
    JSON.stringify(installedApps, null, 2),
    'utf8',
  )
}
