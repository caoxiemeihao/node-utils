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

module.exports = {
  getGithubData,
  readLocalFile,
}
