import { Settings } from './Settings'
import { AppDirectory } from './AppDirectory'
import { InstalledApps } from './InstalledApps'

export type Config = {
  settings: Settings
  installedApps: InstalledApps
  appDirectory: AppDirectory
}
