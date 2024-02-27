export const loginPage = (wrongpass?: string) => `<!DOCTYPE html>
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
        ${
          wrongpass
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
