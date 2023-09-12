import { spawn } from 'child_process'

/**
 *
 * @param {string} command
 * @param {(string)=>void} log
 * @param {undefined} log
 * @returns {Promise<string>}
 */
export const execCommand = async (command, log = console.log) =>
  await new Promise((resolve) => {
    let totalLog = ''
    const writeLog = (str) => {
      log(str)
      totalLog += str
    }
    const child = spawn(command, [], { shell: true })
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
  })
