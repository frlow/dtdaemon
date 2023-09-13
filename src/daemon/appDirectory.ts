import { AppDirectory } from '../types/AppDirectory'

export const getAppDirectory = async (url: string): Promise<AppDirectory> => {
  if (url === 'local')
    return JSON.parse(await Bun.file('./appDirectory.json').text())
  else return await fetch(url).then((r) => r.json())
}
