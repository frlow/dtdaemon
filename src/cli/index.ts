#!/usr/bin/env bun
import {createClient} from '../api'
import inquirer from 'inquirer'
import terminalImage from 'terminal-image'
import {Settings} from '../types/Settings'
import {init, initDaemon} from './init'
import path from "path";

const version = (await Bun.file(path.join(import.meta.path, '..', '..', '..', 'package.json')).json()).version
console.log(`dtdaemon version: ${version}`)
let client = createClient('http://127.0.0.1:8466')

const keypress = async () =>
    new Promise((r) => {
        process.stdin.setRawMode(true)
        process.stdin.resume()
        process.stdin.on('data', () => r(''))
    })

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
        project: {
            type: 'input',
            default: settings.project || "dt",
            message: 'Enter a project name:',
        },
        insecure: {
            type: 'list',
            default: settings.insecure || 'https',
            message: 'Use https encryption?',
            choices: [
                {value: false, name: 'Https (recommended)'},
                {name: 'Http', value: true},
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

if ((await client.status()) !== 200) {
    const result = await inquirer.prompt(
        Object.entries(await prompts({} as any)).map(([name, value]) => ({
            name,
            ...value,
        })),
    )
    await init(client, result)
    await client.update(console.log)
}

while (true) {
    const settings = await client.getSettings()
    const result = await inquirer.prompt([
        {
            name: 'command',
            type: 'list',
            message: 'What do you want to do?',
            choices: ['settings', 'update', 'apps', 'pull', 'rebuild', 'exit'],
        },
    ])
    await Bun.sleep(10)
    switch (result.command) {
        case 'settings':
            const keyResults = await inquirer.prompt([
                {
                    name: 'key',
                    type: 'list',
                    message: 'What setting do you want to change?',
                    choices: ["username", "password", "domain","project", "insecure", "appDirectory"],
                },
            ])
            const key = keyResults.key as string
            const promptsTemp = await prompts(settings)
            const valuePrompts =
                keyResults.key === 'password'
                    ? [
                        {...promptsTemp['password'], name: 'password'},
                        {
                            ...promptsTemp['repeat'],
                            name: 'repeat',
                        },
                    ]
                    : [{...promptsTemp[key], name: key}]
            const valueResults = await inquirer.prompt(valuePrompts)
            await client.saveSettings({
                ...settings,
                [keyResults.key]: valueResults[keyResults.key],
            } as unknown as Settings)
            await client.update(console.log)
            break
        case 'update':
            await client.update(console.log)
            break
        case 'apps':
            const apps = await client.listApps()
            const appResult = await inquirer.prompt([
                {
                    name: 'app',
                    type: 'list',
                    message: 'Manage app',
                    choices: apps
                        .map(app => ({
                            value: app.name,
                            name: `\x1b[${app.installed ? '32' : '0'}m${app.name}\x1b[0m`,
                        })),
                },
            ])
            console.log(appResult)
            const meta = await client.getAppMetadata(appResult.app)
            const image = await client.getAppLogo(appResult.app)
            console.log(
                await terminalImage.buffer(Buffer.from(image, 'base64'), {
                    height: 20,
                    width: 20,
                }),
            )
            console.log(`\n${appResult.app}`)
            console.log(meta.description || '')
            const app = apps.find(a=>a.name===appResult.app)
            const prompt = app?.installed
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
                await client.removeApp(appResult.app)
                await client.update(console.log)
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
                await client.installApp(appResult.app, variables)
                await client.update(console.log)
            } else if (manageResult.command === 'log') {
                const closeLog = await client.log(appResult.app, console.log)
                if (closeLog) {
                    await keypress()
                    closeLog()
                }
            }
            break
        case 'pull':
            await client.pull(console.log)
            await client.update(console.log)
            break
        case 'rebuild':
            await initDaemon(client)
            await client.update(console.log)
            break
        case 'exit':
            process.exit(0)
        default:
            console.log('Command not implemented: ', result.command)
    }
}
