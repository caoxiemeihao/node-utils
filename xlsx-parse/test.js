const fs = require('fs')
const path = require('path')

const { getGithubData } = require('./utils')
const { getVersion, updateApp } = require('./version')

/*
'🍰', '🍦', '🌞', '⛄', '🌜', '🎉', '🎁', '👻', '🚀️',
'🍒', '🍢', '🍡', '🍧', '🍫', '🍭', '🍬', '🥂', '🍺',
*/

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

/* 升级
updateApp({
  cb: ({ cmd, now, files, _files }) => {
    if (cmd === 'data') {
      // console.log(now, files, _files)
    } else if (cmd === 'download-end') {
      console.log('文件下载完成\n', now, files, _files.length)
    } else if (cmd === 'update-end') {
      console.log('🎉 🎉 🎉 🎉 升级完成 🎉 🎉 🎉 🎉')
    }
  }
})
*/
