#!/usr/bin/env node
import {
  getSettings,
  listApps,
  update,
  saveSettings,
  getAppMetadata,
  getAppLogo,
  removeApp,
  installApp,
  pull,
  log,
} from './api.js'
import inquirer from 'inquirer'
import terminalImage from 'terminal-image'
import { Settings } from '../types/Settings'
import { init, daemonStatus } from './init'

const prompts = async (settings: Settings) => {
  return {
    username: {
      type: 'input',
      default: settings.username || undefined,
      message: 'Enter a username:',
    },
    password: {
      type: 'password',
      default: settings.password || undefined,
      message: 'Enter a password:',
    },
    repeat: {
      type: 'password',
      default: settings.password || undefined,
      message: 'Repeat password:',
      validate(input: string, answers: any) {
        const same = input === answers.password
        if (!same) console.log('Passwords do not match')
        return same
      },
    },
    domain: {
      type: 'input',
      default: settings.domain || undefined,
      message: 'Enter a domain name:',
    },
    insecure: {
      type: 'list',
      default: settings.insecure || 'https',
      message: 'Use https encryption?',
      choices: [
        { value: false, name: 'Https (recommended)' },
        { name: 'Http', value: true },
      ],
    },
    appDirectory: {
      type: 'input',
      message: 'App directory url:',
      default:
        settings.appDirectory ||
        'https://raw.githubusercontent.com/frlow/dtdaemon/main/appDirectory.json',
    },
  } as Record<string, any>
}

if ((await daemonStatus()) !== 200) {
  const result = await inquirer.prompt(
    Object.entries(await prompts({} as any)).map(([name, value]) => ({
      name,
      ...value,
    })),
  )
  await init(result)
}

while (true) {
  const settings = await getSettings()
  const result = await inquirer.prompt([
    {
      name: 'command',
      type: 'list',
      default: 'setup',
      message: 'What do you want to do?',
      choices: ['settings', 'update', 'apps', 'pull', 'exit'],
    },
  ])
  switch (result.command) {
    case 'settings':
      const keyResults = await inquirer.prompt([
        {
          name: 'key',
          type: 'list',
          default: 'setup',
          message: 'What setting do you want to change?',
          choices: Reflect.ownKeys(settings).filter(
            (key) => !['repeat'].includes(key as string),
          ),
        },
      ])
      const key = keyResults.key as string
      const promptsTemp = await prompts(settings)
      const valuePrompts =
        keyResults.key === 'password'
          ? [
              { ...promptsTemp['password'], name: 'password' },
              {
                ...promptsTemp['repeat'],
                name: 'repeat',
              },
            ]
          : [{ ...promptsTemp[key], name: key }]
      const valueResults = await inquirer.prompt(valuePrompts)
      await saveSettings({
        ...settings,
        [keyResults.key]: valueResults[keyResults.key],
      } as unknown as Settings)
      await update()
      break
    case 'update':
      await update()
      break
    case 'apps':
      const apps = await listApps()
      const appResult = await inquirer.prompt([
        {
          name: 'app',
          type: 'list',
          message: 'Manage app',
          choices: Object.entries(apps)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, installed]) => ({
              value: name,
              name: `\x1b[${installed ? '32' : '0'}m${name}\x1b[0m`,
            })),
        },
      ])
      const meta = await getAppMetadata(appResult.app)
      const image = await getAppLogo(appResult.app)
      console.log(
        await terminalImage.buffer(Buffer.from(image, 'base64'), {
          height: 20,
          width: 20,
        }),
      )
      console.log(`\n${appResult.app}`)
      console.log(meta.description || '')
      const prompt = apps[appResult.app]
        ? {
            name: 'command',
            type: 'list',
            default: 'return',
            message: `Uninstall ${appResult.app}?`,
            choices: ['uninstall', 'log', 'return'],
          }
        : {
            name: 'command',
            type: 'list',
            default: 'return',
            message: `Install ${appResult.app}?`,
            choices: ['install', 'return'],
          }
      const manageResult = await inquirer.prompt([prompt])
      if (manageResult.command === 'uninstall') {
        await removeApp(appResult.app)
        await update()
      } else if (manageResult.command === 'install') {
        const variables = meta.variables
          ? await inquirer.prompt(
              meta.variables.map((variable: string) => ({
                message: `Variable: ${variable}:`,
                name: variable,
                type: 'input',
              })),
            )
          : {}
        await installApp(appResult.app, variables)
        await update()
      } else if (manageResult.command === 'log') {
        console.log(await log(appResult.app))
      }
      break
    case 'pull':
      await pull()
      await update()
      break
    case 'exit':
      process.exit(0)
    default:
      console.log('Command not implemented: ', result.command)
  }
}