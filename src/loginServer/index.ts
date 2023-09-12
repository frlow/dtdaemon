import { Elysia, t } from 'elysia'
import { cookie } from '@elysiajs/cookie'
import { nanoid } from 'nanoid'

const password = Bun.env.PASSWORD || 'nopass'
const domain = Bun.env.DOMAIN || 'example.com'
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
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log in</title>
<style>

form{
    display: flex;
  flex-direction: column;
  color: white;
}

label{
    text-transform: uppercase;
  font-weight: 300;
  padding: 5px;
}

main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1em;
    margin: 0 auto;
    overflow-x: hidden;
}

h1 {
    color: #335d92;
    text-transform: uppercase;
    font-size: 4rem;
    font-weight: 100;
    line-height: 1.1;
    margin: 1rem;
}

body {
    font-family: Gordita, Roboto, Oxygen, Ubuntu, Cantarell,
    'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #252525;
}

.button{
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid white;
  background-color: #6e6e6e;
  color: white;
  width: 300px;
  margin-top: 1rem;
}
input{
    width: calc(300px - 2.2rem);
  padding: 1.1rem;
  border-radius: 1rem;
  border: white;
  background-color: #4f6679;
  color: white;
}
</style>
</head>

<body>
<main>
      <h1>Login</h1>
      <form method='post' enctype="application/x-www-form-urlencoded">
<!--        <label for='username' >-->
<!--          Username-->
<!--        </label>-->
<!--        <input id='username' name='username' />-->
        <label for='password' >
          Password
        </label>
        <input
          id='password'
          name='password'
          type='password'
        />
        ${query.wrongpass
        ? `
          <div style="color: firebrick;">
            Wrong username or password
          </div>
        `
        : ''
      }
        <input
        class="button"
          type='submit'
          value='Login'
        />
      </form>
    </main>
</body>

</html>`
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
          domain: request.url.startsWith('http://localhost:3000')
            ? ''
            : domain, expires
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
    if (tokens[accessToken] && Date.now()<tokens[accessToken]) {
      set.status = 200
      return
    }
    const forwardUrl = headers['x-forwarded-uri']?.split('?')[0] || '/'
    const forwardedHost = headers['x-forwarded-host']
    set.redirect = `http${insecure ? '' : 's'
      }://${forwardedHost}/__login?redirect=${forwardUrl}`
  })
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
