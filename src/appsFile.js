import * as fs from 'fs'
import path from 'path'
import YAML from 'yaml'

/**
 * @typedef {import('./types/AppDirectory.js').AppDirectory} AppDirectory
 */

/**
 *
 * @returns {AppDirectory}
 */
export const loadApps = () => {
  const appDir = './apps'
  const files = fs.readdirSync(appDir)
  const appDirectory = {}
  for (const file of files) {
    const filePath = path.join(appDir, file)
    const { name, ext } = path.parse(filePath)
    if (!appDirectory[name]) appDirectory[name] = {}
    if (ext === '.yaml')
      appDirectory[name] = {
        ...appDirectory[name],
        ...YAML.parse(fs.readFileSync(filePath, 'utf8')),
      }
    else if (ext === '.png')
      appDirectory[name].logoImage = Buffer.from(
        fs.readFileSync(filePath),
      ).toString('base64')
  }
  // @ts-ignore
  return appDirectory
}

if (process.argv[2] === 'bundle')
  fs.writeFileSync(
    path.join('./appDirectory.json'),
    JSON.stringify(loadApps(), null, 2),
    'utf8',
  )
