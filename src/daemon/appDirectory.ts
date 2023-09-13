import { loadApps } from './appsFile'
import { AppDirectory } from '../types/AppDirectory'

export const getAppDirectory = async (url: string): Promise<AppDirectory> => {
  if (url === 'local') return loadApps()
  else return await fetch(url).then((r) => r.json())
}
