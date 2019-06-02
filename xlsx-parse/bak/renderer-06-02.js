// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron')
const XLSX = require('./xlsx-parse')
const utils = require('./utils')
const path = require('path')
const { getVersion, updateApp } = require('./version')

const vm = new Vue({
  data: {
    downloadPath: window.localStorage.getItem('download-path') || '',
    homedir: '',
    logInfo: '',
    local_version: '0.0.0',
    remote_version: '0.0.0',
  },
  methods: {
    uploadFile() {
      utils.readLocalFile().then(res => {
        console.log(res[0])
        XLSX.parse(res[0].path, ({ cmd, data }) => {
          console.log(vm.logInfo = `🍡 读取完成，开始下载...`, cmd, data)
          return
          if (cmd === 'read-xlsx') {
            let arr = data.map(json => {
              let urls = null

              try {
                urls = JSON.parse(json.urls)
              } catch (e) { console.warn(e) }

              return {
                name: json.name.replace('#', ''),
                urls: urls ? urls[0].thirdPardMessage[0].value : null // 图片链接
              }
            }).filter(json => json.urls) // {name: "#2780", URL: "https://uploadery.s3.amazonaws.com/meta-charms/9e475a10-FB_IMG_1558777592261.jpg"}

            vm.downloadIMG(arr)
          }
        })
      })
    },
    choosePath() {
      remote.dialog.showOpenDialog({
        //默认路径
        defaultPath: path.join(vm.homedir, 'Desktop'), // 桌面
        //选择操作，此处是打开文件夹
        properties: [
          'openDirectory',
        ],
        //过滤条件
        filters: [
          { name: 'All', extensions: ['*'] },
        ]
      },
        res => { // ["C:\Users\30848\Desktop"]
        //回调函数内容，此处是将路径内容显示在input框内
        if (Array.isArray(res)) {
          window.localStorage.setItem('download-path', vm.downloadPath = res[0])
        }
      })
    },
    downloadIMG(arr = []) {
      if (!this.downloadPath) {
        this.choosePath()
        return
      }

      let now = 0

      download(arr[now])
      function download(json) {
        let filename = `${vm.downloadPath}\\${json.name}${json.urls.substring(json.urls.lastIndexOf('.'))}`

        XLSX.downloadIMG({ url: json.urls, filename, cb: ev => {
          if (ev.cmd === 'img-data') {
            vm.logInfo = `🚀️ [${now + 1}/${arr.length}] 下载中...`
          } else if (ev.cmd === 'img-end') {
            now++

            vm.logInfo = `🚀️ [${now + 1}/${arr.length}] 下载中...`
            // console.log(vm.logInfo)
            if (arr[now]) {
              download(arr[now])
            } else {
              // alert('下载完了')
              vm.logInfo = `🍺 [${now + 1}/${arr.length}] 下载完成！`
            }
          }
        } })
      }
    },
    setDefaultPath() {
      ipcRenderer.on('homedir', (event, homedir) => vm.homedir = homedir)
      ipcRenderer.send('homedir')
    },
    getVersion() {
      getVersion(({ local_version, remote_version }) => {
        vm.local_version = local_version
        vm.remote_version = remote_version
      })
    },
    upgradeApp() {
      if (vm.remote_version === vm.local_version) {
        if (!window.confirm('当前版本是最新的哦，确定要更新嘛，亲？ ^_^')) return
      }

      updateApp({
        cb: ({ cmd, now, files, _files }) => {
          if (cmd === 'data') {
            console.log(vm.logInfo = `🚀️ [${now + 1}/${files.length}] 下载中... ${files[now]}`)
          } else if (cmd === 'download-end') {
            console.log(vm.logInfo = '🍺 文件下载完成\n', now + 1, files, _files.length)
          } else if (cmd === 'update-end') {
            console.log(vm.logInfo = '🎉 🎉 🎉 🎉 升级完成，请重新打开软件 🎉 🎉 🎉 🎉')
          }
        }
      })
    }
  },
  mounted() {
    this.setDefaultPath()
    this.getVersion()
  }
}).$mount('#app')

/**
 * 图片 urls
[
    {
        "thirdPardMessage":[
            {
                "name":"_uploadery_1",
                "value":"https://uploadery.s3.amazonaws.com/meta-charms/e49b772a-IMG_49911.jpg"
            }
        ],
        "type":1,
        "customMessgae":{
            "podType":1,
            "zone":{
                "front":{
                    "showimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/5392159987651.jpg",
                    "editimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/2329113007948.png",
                    "podtype":"picandtext"
                }
            }
        }
    }
]
*/
