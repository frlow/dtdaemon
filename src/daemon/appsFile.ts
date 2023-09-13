import * as fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { AppDirectory } from '../types/AppDirectory'

export const loadApps = () => {
  const appDir = './apps'
  const files = fs.readdirSync(appDir)
  const appDirectory: AppDirectory = {}
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
