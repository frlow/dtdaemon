import fs from 'fs'
import path from 'path'

/**
 * @typedef {import('./types/Settings.js').Settings} Settings
 */

const settingsPath = './config/settings.json'

/**
 * @returns {Settings}
 */
export const getSettings = () =>
  fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    : {}

/**
 *
 * @param {Settings} settings
 */
export const saveSettings = (settings) => {
  if (!fs.existsSync(path.dirname(settingsPath)))
    fs.mkdirSync(path.dirname(settingsPath))
  if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}', 'utf8')
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
}
