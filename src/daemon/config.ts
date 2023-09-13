import fs from 'fs'
import path from 'path'
import { Settings } from '../types/Settings'
import { InstalledApps } from '../types/InstalledApps'
import { getAppDirectory } from './appDirectory'

const settingsPath = './config/settings.json'
const installedAppsPath = './config/apps.json'

export const getConfig = async () => {
  const settings = getSettings()
  const installedApps = getInstalledApps()
  const appDirectory = await getAppDirectory(settings.appDirectory)
  return {
    settings,
    appDirectory,
    installedApps,
  }
}

export const getSettings = () => loadConfig<Settings>(settingsPath)
export const saveSettings = (settings: Settings) =>
  saveConfig(settingsPath, settings)

export const getInstalledApps = () =>
  loadConfig<InstalledApps>(installedAppsPath)
export const saveInstalledApps = (installedApps: InstalledApps) =>
  saveConfig(installedAppsPath, installedApps)

const loadConfig = <T>(file: string): T =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}

const saveConfig = (file: string, config: any) => {
  if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file))
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}', 'utf8')
  fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8')
}
