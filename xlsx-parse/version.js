const fs = require('fs')
const { getGithubData } = require('./utils')

const files = [
  'index.html',
  'renderer.js',
  'xlsx-parse.js',
  'utils.js',
  'main.js',
  'config.js',
  'package.json'
]

function getVersion(cb = _ => _) {
  const package_json_local = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

  getGithubData('package.json').then(file => {
    const package_json_remote = JSON.parse(file)

    cb({
      local_version: package_json_local.version,
      remote_version: package_json_remote.version
    })
  })
}

function updateApp({ files = [
  'index.html',
  'renderer.js',
  'xlsx-parse.js',
  'utils.js',
  'main.js',
  'config.js',
  'package.json'
], cb = _ => _ }) {
  let now = 0
  let _files = []

  downloadFile(files[now])
  function downloadFile(filepath) {
    console.log(filepath)
    getGithubData(filepath).then(file => {
      _files.push(file)
      now++
      cb({ cmd: 'data', now, files, _files })
      if (files[now]) {
        downloadFile(files[now])
      } else {
        cb({ cmd: 'end', now, files, _files })
      }
    })
  }
}

module.exports = {
  getVersion,
  updateApp,
}
