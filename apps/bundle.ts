import fs from 'fs'
import path from 'path'
import YAML from 'yaml'

export const loadApps = () => {
  const appDir = './apps'
  const files = fs.readdirSync(appDir)
  const appDirectory: any = {}
  for (const file of files) {
    const filePath = path.join(appDir, file)
    const { name, ext } = path.parse(filePath)

    if (ext === '.yaml') {
      if (!appDirectory[name]) appDirectory[name] = {}
      appDirectory[name] = {
        ...appDirectory[name],
        ...YAML.parse(fs.readFileSync(filePath, 'utf8')),
      }
    } else if (ext === '.png') {
      if (!appDirectory[name]) appDirectory[name] = {}
      appDirectory[name].logoImage = Buffer.from(
        fs.readFileSync(filePath),
      ).toString('base64')
    }
  }
  // @ts-ignore
  return appDirectory
}

fs.writeFileSync(
  path.join('./appDirectory.json'),
  JSON.stringify(loadApps(), null, 2),
  'utf8',
)
