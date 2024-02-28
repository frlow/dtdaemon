import {Elysia} from 'elysia'
import {cookie} from '@elysiajs/cookie'
import {createClient} from "../api";

const host = process.env.HOST || 'http://127.0.0.1:8466'
export const client = createClient(host)

export type Apps = Awaited<ReturnType<typeof client.listApps>>

const app = new Elysia()
    .use(cookie())
    .get('/', async ({query, set}) => {
      set.headers = {
        'content-type': 'text/html',
      }
      const settings = await client.getSettings()
      const protocol = `http${settings.insecure ? '' : 's'}://`
      const apps = await client.listApps()
      return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${settings.domain} - Apps</title>
<style>
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

.apps{
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
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
a {
    text-decoration: none;
}

.root {
    background-color: #4f4f4f;
    color: white;
    padding: 1rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 10px;
    border-radius: 4px;
    height: 60px;
    width: 300px;
}

.title {
    display: flex;
    align-items: center;
}

.logo {
    width: 60px;
    height: 60px;
}
</style>
</head>

<body>
<main>
      <h1>Apps</h1>
        <div class="apps">
        ${apps.filter(app => app.installed && app.ingresses?.length > 0).map(app => `
          <a href="${protocol}${app.ingresses[0]}.${settings.domain}">
              <div class="root">
                  <div class="title">${app.name}</div>
                  <img src="/images/${app.name}.png" alt="${app.name}" class="logo"/>
              </div>
          </a>
      `).join("\n")}
        </div>
    </main>
</body>

</html>`

    })
    .get("/images/:id", async ({set, params}) => {
      const name = params.id
      if (!name) throw "image id not valid"
      const image = await client.getAppLogo(name.replace(".png", '')).catch(() => undefined)
      if (!image) throw "image not found"
      const buffer = Buffer.from(image, "base64")
      set.headers = {
        'content-type': 'image/png',
        'Content-Length': buffer.length.toString()
      }
      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': buffer.length.toString()
        }
      })
    })
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
