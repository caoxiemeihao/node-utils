const fs = require('fs')
const { getGithubData } = require('./utils')
const path = require('path')

const defaultFiles = [
  'index.html',
  'renderer.js',
  'xlsx-parse.js',
  'utils.js',
  'main.js',
  'config.js',
  'package.json'
]

function getVersion(cb = _ => _) {
  const package_json_local = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))

  getGithubData('package.json').then(file => {
    const package_json_remote = JSON.parse(file)

    cb({
      local_version: package_json_local.version,
      remote_version: package_json_remote.version
    })
  })
}

function updateApp({ files = defaultFiles, cb = _ => _ }) {
  let now = 0
  let _files = []

  downloadFile(files[now])
  function downloadFile(filepath) {
    getGithubData(filepath).then(file => {
      _files.push(file)
      now++
      cb({ cmd: 'data', now, files, _files })
      if (files[now]) {
        downloadFile(files[now])
      } else {
        cb({ cmd: 'download-end', now, files, _files })
        writeFiles({ files, _files, cb: _ => {
          cb({ cmd: 'update-end', now, files, _files })
        } })
      }
    })
  }
}

function writeFiles({ files, _files, cb = _ => _ }) {
  let now = 0

  writeFile(files[now], _files[now])
  function writeFile(filepath, data) {
    let _path = path.join(__dirname, filepath)

    console.log('🍺', _path)
    fs.writeFileSync(_path, data)
    now++
    if (files[now]) {
      writeFile(files[now], _files[now])
    } else {
      cb()
    }
  }
}

module.exports = {
  getVersion,
  updateApp,
}
