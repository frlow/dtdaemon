/**
 * @typedef {import('./types/Settings.js').Settings} Settings
 * @typedef {Record<string, Record<string, string>>} InstalledApps
 */
import fs from 'fs'
import path from 'path'

const settingsPath = './config/settings.json'
const installedAppsPath = './config/apps.json'

/** * @returns {Settings} */ export const getSettings = () =>
  getConfig(settingsPath)
/** @param {Settings} settings */ export const saveSettings = (settings) =>
  saveConfig(settingsPath, settings)

/** * @returns {InstalledApps} */ export const getInstalledApps = () =>
  getConfig(installedAppsPath)
/** @param {InstalledApps} installedApps */ export const saveInstalledApps = (
  installedApps,
) => saveConfig(installedAppsPath, installedApps)

const getConfig = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}

const saveConfig = (file, config) => {
  if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file))
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}', 'utf8')
  fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8')
}
