import { Log } from './types/Log'
import { spawn } from 'child_process'

export const execCommand = (
  command: string,
  log: Log = console.log,
): { result: Promise<string>; cancel: () => void } => {
  const child = spawn(command, [], { shell: true })
  let totalLog = ''
  let resolve: (value: string) => void
  return {
    result: new Promise((_resolve) => {
      resolve = _resolve
      const writeLog = (str: string) => {
        log(str)
        totalLog += str
      }
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', function (data) {
        writeLog(data.toString())
      })

      child.stderr.setEncoding('utf8')
      child.stderr.on('data', function (data) {
        writeLog(data.toString())
      })

      child.on('close', function (code) {
        resolve(totalLog)
      })
    }),
    cancel: () => {
      child.kill('SIGINT')
    },
  }
}
