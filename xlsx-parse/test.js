const { getGithubData } = require('./utils')
const { getVersion, updateApp } = require('./version')

/* 拉取远程文件
getGithubData('package.json').then(res => {
  console.log(res)
  console.log('-----------------------')
  console.log(JSON.parse(res).version)
})
*/

/* 获取远程版本
getVersion(({ local_version, remote_version }) => {
  console.log(local_version, remote_version)
})
*/

updateApp({
  cb: ({ cmd, now, files, _files }) => {
    if (cmd === 'data') {
      console.log(now, files, _files)
    } else if (cmd === 'end') {
      console.log(now, files, _files)
    }
  }
})
