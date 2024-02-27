import { Elysia, t } from 'elysia'
import { cookie } from '@elysiajs/cookie'
import { nanoid } from 'nanoid'
import { loginPage } from './loginPage'

// @ts-ignore
const password = Bun.env.PASSWORD || 'nopass'
// @ts-ignore
const domain = Bun.env.DOMAIN || 'example.com'
// @ts-ignore
const insecure = !!Bun.env.INSECURE || false

const tokens: Record<string, number> = {}

export const generateToken = () => {
  const token = nanoid(32)
  const expires = Date.now() + 86400000
  tokens[token] = expires
  return { token, expires }
}

const app = new Elysia()
  .use(cookie())
  .get('/__login', ({ query, set }) => {
    set.headers = {
      'content-type': 'text/html',
    }
    return loginPage(query.wrongpass as any)
  })
  .post(
    '/__login',
    async ({ body, query, set, request, setCookie, removeCookie }) => {
      if (body.password === password) {
        const token = generateToken()
        const expires = new Date()
        expires.setTime(token.expires)
        removeCookie('access-token')
        setCookie('access-token', token.token, {
          domain: request.url.startsWith('http://localhost:3000') ? '' : domain,
          expires,
        })
        set.redirect = `${query.redirect || '/'}`
      } else {
        const queries = ['wrongpass=true']
        if (query.redirect) queries.push(`redirect=${query.redirect}`)
        set.redirect = `/__login?${queries.join('&')}`
      }
    },
    {
      type: 'application/x-www-form-urlencoded',
      body: t.Object({ password: t.String() }),
    },
  )
  .get('/__login/q', ({ cookie, set, headers }) => {
    const accessToken = cookie['access-token']
    if (tokens[accessToken] && Date.now() < tokens[accessToken]) {
      set.status = 200
      return
    }
    const forwardUrl = headers['x-forwarded-uri']?.split('?')[0] || '/'
    const forwardedHost = headers['x-forwarded-host']
    set.redirect = `http${
      insecure ? '' : 's'
    }://${forwardedHost}/__login?redirect=${forwardUrl}`
  })
  .get('/', ({ cookie, set, headers }) => {
    return 'hello world'
  })
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
