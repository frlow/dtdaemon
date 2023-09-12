import { execCommand } from './exec.js'
import { authService, traefikService } from './services.js'

/**
 * @typedef {import('./types/Settings.js').Settings} Settings
 * @typedef {import('./types/Compose.js').ComposeSpecification} ComposeSpecification
 * @typedef {import('./types/Compose.js').DefinitionsService} DefinitionsService
 * @typedef {import('./types/AppDirectory.js').AppConfig} AppConfig
 * @typedef {import('./types/AppDirectory.js').AppDirectory} AppDirectory
 * @typedef {Record<string, Record<string, string>>} InstalledApps
 * @typedef {{
 *   domain: string
 *   port: number
 *   service: string
 *   insecure?: boolean
 *   protocol?: 'http' | 'https'
 * }} Ingress
 * @typedef {{
 * settings: Settings,
 * installedApps: InstalledApps,
 * appDirectory: AppDirectory
 * }} ComposeConfig
 */

/**
 *
 * @param {ComposeConfig} config
 * @param {string} id
 * @param {(msg: string)=>void} log
 * @returns {Promise<void>}
 */
export const dockerLog = async (config, id, log) => {
  const compose = await generateCompose(config)
  const command = `docker compose -p ${config.settings.project} -f - logs ${id}`
  await execCommand(`echo '${JSON.stringify(compose)}' | ${command}`, log)
}

/**
 *
 * @param {ComposeConfig} config
 * @param {(msg: string)=>void} log
 * @returns {Promise<void>}
 */
export const dockerInstall = async (config, log) => {
  const compose = await generateCompose(config)
  const settings = config.settings
  const base64 = Buffer.from(JSON.stringify(compose)).toString('base64')
  await execCommand(
    `echo ${base64} | base64 -d | docker compose -p ${settings.project} -f - up -d --remove-orphans`,
    log,
  )
}
/**
 *
 * @param {ComposeConfig} config
 * @param {(msg: string)=>void} log
 * @returns {Promise<void>}
 */
export const dockerPull = async (config, log) => {
  const compose = await generateCompose(config)
  const settings = config.settings
  const command = `docker compose -p ${settings.project} -f - pull`
  await execCommand(`echo '${JSON.stringify(compose)}' | ${command}`, log)
}

/**
 *
 * @param { ComposeConfig } config
 * @returns {Promise<ComposeSpecification>}
 */
const generateCompose = async (config) => {
  const settings = config.settings
  const installedApps = config.installedApps
  const installed = Object.entries(installedApps).flatMap(([id, variables]) => {
    const appConfig = getAppConfig(id, config)
    const services = appConfig.services
    const ingresses = /** @type {Ingress[]} */ Object.entries(
      appConfig.ingresses || {},
    ).map(([id, value]) => {
      if (typeof value === 'number')
        return {
          domain: id,
          port: Math.abs(value),
          service: id,
          insecure: value < 0,
        }
      else
        return {
          domain: value.domain || id,
          port: value.port,
          service: id,
          insecure: !!value.insecure,
          protocol: value.protocol,
        }
    })
    for (const ingress of ingresses) {
      const service = services[ingress.service]
      applyIngress(service, ingress, settings)
    }
    const ret = Object.entries(services)
    ret.forEach((r) => (r[1].restart = 'always'))
    const withVariables = ret.map(([key, service]) => [
      key,
      replaceVariables(service, {
        username: settings.username,
        password: settings.password,
        domain: settings.domain,
        ...variables,
      }),
    ])
    return withVariables
  })
  const traefik = applyIngress(
    traefikService(settings.insecure),
    { service: 'traefik', port: 8080, domain: 'traefik' },
    settings,
  )
  installed.push(['traefik', traefik])
  installed.push(['auth', authService(settings)])
  // installed.push(['templates', templatesService(settings)])
  const services = installed.reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {},
  )
  const volumes = installed.reduce((acc, [key, value]) => {
    value.volumes
      ?.filter((v) => !v.startsWith('/'))
      .map((v) => v.split(':')[0].trim())
      .forEach((nv) => (acc[nv] = {}))
    return acc
  }, {})
  return {
    services,
    volumes,
  }
}

/**
 *
 * @param {DefinitionsService} service
 * @param {Record<string,string>} variables
 * @returns DefinitionsService
 */
const replaceVariables = (service, variables) => {
  let str = JSON.stringify(service)
  Object.entries(variables).forEach(([key, value]) => {
    const regexp = new RegExp(`{{${key}}}`, 'g')
    str = str.replace(regexp, value)
  })
  return JSON.parse(str)
}

/**
 *
 * @param {DefinitionsService} service
 * @param {Ingress } ingress
 * @param {Settings} settings
 * @returns {DefinitionsService}
 */
const applyIngress = (service, ingress, settings) => {
  service.labels = service.labels || ['traefik.enable=true']
  // @ts-ignore
  service.labels.push(
    ...[
      `traefik.http.routers.${ingress.service}-${ingress.domain}.rule=Host(\`${ingress.domain}.${settings.domain}\`)`,
      `traefik.http.services.${ingress.service}-${ingress.domain}.loadbalancer.server.port=${ingress.port}`,
      `traefik.http.routers.${ingress.service}-${ingress.domain}.service=${ingress.service}-${ingress.domain}`,
      `traefik.http.routers.${ingress.service}-${
        ingress.domain
      }.entrypoints=web${settings.insecure ? '' : 'secure'}`,
    ],
  )
  if (!settings.insecure) {
    // @ts-ignore
    service.labels.push(
      `traefik.http.routers.${ingress.service}-${ingress.domain}.tls.certresolver=default`,
    )
  }
  if (!ingress.insecure) {
    // @ts-ignore
    service.labels.push(
      ...[
        `traefik.http.middlewares.${ingress.service}-${ingress.domain}.forwardauth.address=http://auth:3000/__login/q`,
        `traefik.http.routers.${ingress.service}-${ingress.domain}.middlewares=${ingress.service}-${ingress.domain}@docker`,
      ],
    )
  }
  if (ingress.protocol) {
    // @ts-ignore
    service.labels.push(
      `traefik.http.services.${ingress.service}-${ingress.domain}.loadbalancer.server.scheme=${ingress.protocol}`,
    )
  }
  return service
}

/**
 * @param { string } id
 * @param { ComposeConfig } config
 * @returns {AppConfig}
 */
const getAppConfig = (id, config) =>
  JSON.parse(JSON.stringify(config.appDirectory[id]))
