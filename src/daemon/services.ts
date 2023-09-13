import { Settings } from '../types/Settings'

export const traefikService = (insecure: boolean) => {
  const traefik = {
    image: 'traefik',
    ports: ['80:80', '443:443'],
    volumes: ['/var/run/docker.sock:/var/run/docker.sock', 'traefik:/data'],
    restart: 'always',
    command: [
      '--providers.docker=true',
      '--providers.docker.exposedByDefault=false',
      '--api.insecure=true',
      '--log.level=DEBUG',
      '--entrypoints.web.address=:80',
      '--serverstransport.insecureskipverify=true',
    ],
  }
  if (!insecure)
    traefik.command.push(
      ...[
        '--entrypoints.websecure.address=:443',
        '--entrypoints.web.http.redirections.entryPoint.to=websecure',
        '--certificatesresolvers.default.acme.tlsChallenge=true',
        '--certificatesresolvers.default.acme.storage=/data/acme.json',
      ],
    )
  return traefik
}

export const authService = (settings: Settings) => {
  const service = {
    image: 'simple-auth',
    restart: 'always',
    environment: [
      `PASSWORD=${settings.password}`,
      `DOMAIN=${settings.domain}`,
      `INSECURE=${settings.insecure}`,
    ],
    labels: [
      'traefik.enable=true',
      'traefik.http.routers.auth.rule=PathPrefix(`/__login`)',
      'traefik.http.routers.auth.priority=1000',
      'traefik.http.services.auth.loadbalancer.server.port=3000',
      'traefik.http.routers.auth.service=auth',
      `traefik.http.routers.auth.entrypoints=web${
        settings.insecure ? '' : 'secure'
      }`,
    ],
  }
  return service
}

export const daemonService = (settings: Settings) => {
  const service = {
    image: 'dtdaemon',
    restart: 'always',
    volumes: ['/var/run/docker.sock:/var/run/docker.sock', 'dtdaemon:/config'],
    labels: [
      'traefik.enable=true',
      'traefik.http.routers.auth.rule=PathPrefix(`/__login`)',
      'traefik.http.routers.auth.priority=1000',
      'traefik.http.services.auth.loadbalancer.server.port=3000',
      'traefik.http.routers.auth.service=auth',
      `traefik.http.routers.auth.entrypoints=web${
        settings.insecure ? '' : 'secure'
      }`,
    ],
  }
  return service
}
