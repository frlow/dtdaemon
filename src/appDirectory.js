/**
 * @typedef {import('./types/AppDirectory.js').AppDirectory} AppDirectory
 */

import { loadApps } from './appsFile.js'

/**
 *
 * @param {string} url
 * @return {Promise<AppDirectory>}
 */
export const getAppDirectory = async (url) => {
  if (url === 'local') return loadApps()
  else throw 'Not Implemented yet!'
}
