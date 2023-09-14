import { authService, traefikService } from './services'
import { Log } from '../types/Log'
import { Config } from '../types/Config'
import { Settings } from '../types/Settings'
import { Ingress } from '../types/Ingress'
import { ComposeSpecification, DefinitionsService } from '../types/Compose'
import { upAll, pullAll, logs } from 'docker-compose/dist/v2'
import { execCommand } from '../exec'

export const dockerLog = (config: Config, id: string) => {
  const queue: string[] = []
  let resolve: ((value: any) => void) | undefined

  let closed = false
  const log = (msg: string) => {
    if (resolve) {
      resolve(msg)
      resolve = undefined
    } else queue.push(msg)
  }

  const { cancel } = execCommand(`docker logs dt-${id}-1 -f`, log)

  const next = async (): Promise<string | undefined> => {
    if (closed) return undefined
    if (queue.length > 0) return queue.shift()
    return new Promise<string>((r) => (resolve = r))
  }
  const close = () => {
    cancel()
    closed = true
    resolve && resolve(undefined)
  }
  return { next, close }
}

export const dockerInstall = async (config: Config, log: Log) => {
  await upAll({
    configAsString: JSON.stringify(await generateCompose(config)),
    composeOptions: ['-p', 'dt'],
    commandOptions: ['--remove-orphans'],
    callback: (chunk) => log(Buffer.from(chunk).toString('utf8')),
  })
}

export const dockerPull = async (config: Config, log: Log) => {
  const compose = await generateCompose(config)
  delete (compose.services || {})['auth']
  delete (compose.services || {})['dtdaemon']
  console.log(compose)
  await pullAll({
    configAsString: JSON.stringify(compose),
    composeOptions: ['-p', 'dt'],
    callback: (chunk) => log(Buffer.from(chunk).toString('utf8')),
  })
}

const generateCompose = async (
  config: Config,
): Promise<ComposeSpecification> => {
  const settings = config.settings
  const installedApps = config.installedApps
  const installed = Object.entries(installedApps).flatMap(([id, variables]) => {
    const appConfig = getAppConfig(id, config)
    const services = appConfig.services
    const ingresses: Ingress[] = Object.entries(appConfig.ingresses || {}).map(
      ([id, value]: [id: string, value: any]) => {
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
      },
    )
    for (const ingress of ingresses) {
      const service = services[ingress.service]
      applyIngress(service, ingress, settings)
    }
    const ret: any = Object.entries(services)
    ret.forEach((r: any) => (r[1].restart = 'always'))
    const withVariables = ret.map(([key, service]: any) => [
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
  const services = installed.reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {},
  )
  const volumes = installed.reduce((acc, [key, value]) => {
    value.volumes
      ?.filter((v: any) => !v.startsWith('/'))
      .map((v: any) => v.split(':')[0].trim())
      .forEach((nv: any) => (acc[nv] = {}))
    return acc
  }, {})
  const networks = {default: {}, dtdaemon: {external: true}}
  return {
    services,
    volumes,
    networks
  }
}

const replaceVariables = (
  service: DefinitionsService,
  variables: Record<string, string>,
) => {
  let str = JSON.stringify(service)
  Object.entries(variables).forEach(([key, value]) => {
    const regexp = new RegExp(`{{${key}}}`, 'g')
    str = str.replace(regexp, value)
  })
  return JSON.parse(str)
}

const applyIngress = (
  service: DefinitionsService,
  ingress: Ingress,
  settings: Settings,
) => {
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

const getAppConfig = (id: string, config: Config) =>
  JSON.parse(JSON.stringify(config.appDirectory[id]))
