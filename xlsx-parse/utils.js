const fs = require('fs')
const https = require('https')

function getGithubData(filepath = '', success = _ => _, error = _ => _) {
  return new Promise((resolve, reject) => {
    const url = githubURL(filepath)

    https.get(url, res => {
      const statusCode = res.statusCode

      console.log(`[statusCode: ${statusCode}] -> ${url}`)

      if (statusCode !== 200) {
        error(res)
        reject(res)
        res.resume() // 消耗响应数据以释放内存

        return
      }

      res.setEncoding('utf-8')

      let rawData = ''

      res.on('data', chunk => {
        rawData += chunk
        // console.log(rawData)
      }).on('end', _ => {
        success(rawData)
        resolve(rawData)
      }).on('error', e => {
        error(e)
        reject(e)
      })
    })

  })
}


function githubURL(filepath) {
  // github 项目文件地址
  const URL = 'https://raw.githubusercontent.com/caoxiemeihao/node-utils/master/xlsx-parse/'

  return `${URL + filepath.replace('/', '')}?r=${Date.now()}`
}


/**
 * 读取本地图片，文件
 * [默认读取图片]
 * 返回 Promise，支持回调
 */
function readLocalFile(param = {}) {
  let { accept = '.xlsx, .xls', success, failed } = param

  return new Promise((resolve, rejcet) => {
    let oInput = document.createElement('input')

    oInput.type = 'file'
    oInput.accept = accept
    oInput.multiple = 'multiple'
    oInput.onchange = ev => {
      resolve(ev.target.files)
      success && success(ev.target.files)
    }
    oInput.click()
  })
}

function exist_dir_file(fullPath) {
  try {
    // fs.accessSync(path.join(__dirname, dirPath), fs.F_OK)
    fs.accessSync(fullPath, fs.F_OK)
    return true
  } catch (e) {
    console.log('No such file or directory ->', e.path)
    return false
  }
}

function errorAlert(e) {
  console.warn(e)
  alert(`程序有报错哦亲 ^_^\n偷偷告诉你个小秘密 [308487730] 介个是作者的QQ号\n\n${e}`)
}

const log = {
  green: (str, second = '') => console.log(`%c ${str} `, 'background:#41b883; color:#fff', second),
  blue: (str, second = '') => console.log(`%c ${str} `, 'background:#2db7f5; color:#fff', second),
  black: (str, second = '') => console.log(`%c ${str} `, 'background:#666; color:#fff', second),
  error: (str, second = '') => console.log(`%c ${str} `, 'background:#fa6470; color:#fff', second),
}

module.exports = {
  getGithubData,
  readLocalFile,
  exist_dir_file,
  errorAlert,
  log,
}
