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
  readLocalFile,
}
