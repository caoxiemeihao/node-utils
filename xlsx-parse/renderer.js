// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron')
const XLSX = require('./xlsx-parse')
const utils = require('./utils')
const path = require('path')
const fs = require('fs')
const { getVersion, updateApp } = require('./version')

const vm = new Vue({
  data: {
    downloadPath: window.localStorage.getItem('download-path') || '',
    homedir: '',
    logInfo: '',
    local_version: '0.0.0',
    remote_version: '0.0.0',
    downloadArr: [],
    startedDownload: false,
  },
  methods: {
    chooseSaveFilePath() {
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
    pickAll(bool) {
      vm.downloadArr = vm.downloadArr.map(item => {
        item.pick = bool

        return item
      })
    },
    pickItem(item, idx) {
      vm.downloadArr = vm.downloadArr.map(_item => {
        if (_item === item) {
          _item.pick = !_item.pick
        }

        return _item
      })
    },
    startDownload() {
      if (!vm.downloadArr.length) return

      if (vm.startedDownload === true) {
        window.alert('图片下载还没有全部完成亲 ^_^\n需要重新下载，点击 刷新 按钮')
      } else {
        vm.startedDownload = true
        vm.downloadIMG(vm.downloadArr.filter(item => item.pick))
      }
    },


    /** 核心逻辑 s */
    uploadFile() {
      utils.readLocalFile().then(res => {
        console.log('获取文件 ->', res[0])
        XLSX.parse(res[0].path, ({ cmd, data }) => {
          console.log(cmd, vm.logInfo = `🍡 读取完成，等待下载...`, data)
          // data = [{OrderNumber: "#2812", SKU: "CJJJJTCF00488-Heart-Blue box*1;@1", Attachment: "https://uploadery.s3.amazonaws.com/meta-charms/e49b772a-IMG_49911.jpg"}]
          vm.downloadArr = data.map(item => {
            item.pick = true

            return item
          })
          // if (cmd === 'read-xlsx') vm.downloadIMG(data)
        })
      })
    },
    downloadIMG(arr = []) {
      if (!arr.length) return
      if (!this.downloadPath) {
        this.chooseSaveFilePath()
        return
      }

      let now = 0

      download(arr[now])
      function download(json) {
        if (!json.Attachment) {
          now++
          arr[now] && download(arr[now])

          return
        }

        let arr1
          , dirName
          , sum
          , targetFolder
          , filename

        try {
          arr1 = json.SKU.split(';') // SKU: "CJJJJTCF00488-Heart-Blue box*1;@1"
          dirName = arr1[0].split('-')[1]
          sum = arr1[arr1.length - 1].match(/@\d$/g)[0][1]

          // console.log(arr1, dirName, sum)

          targetFolder = `${vm.downloadPath}\\${dirName}\\${sum}`
          utils.exist_dir_file(targetFolder) || fs.mkdirSync(targetFolder, { recursive: true })
          filename = `${targetFolder}\\${json.OrderNumber}${json.Attachment.substring(json.Attachment.lastIndexOf('.'))}`

          // console.log(filename)

          XLSX.downloadIMG({ url: json.Attachment, filename, cb: ev => {
            if (ev.cmd === 'img-data') {
              vm.logInfo = `🚀️ [${now}/${arr.length}] ${json.OrderNumber} 下载中...`
            } else if (ev.cmd === 'img-end') {
              now++

              vm.logInfo = `🚀️ [${now}/${arr.length}] ${json.OrderNumber} 下载中...`
              // console.log(vm.logInfo)
              if (arr[now]) {
                download(arr[now])
              } else {
                // alert('下载完了')
                vm.logInfo = `🍺 [${now}/${arr.length}] 下载完成！`
                vm.startedDownload = false
              }
            }
          } })
        } catch (e) { utils.errorAlert(e) }
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
            console.log(vm.logInfo = `🚀️ [${now}/${files.length}] 下载中... ${files[now]}`)
          } else if (cmd === 'download-end') {
            console.log(vm.logInfo = '🍺 文件下载完成\n', now, files, _files.length)
          } else if (cmd === 'update-end') {
            console.log(vm.logInfo = '🎉 🎉 🎉 🎉 升级完成，请重新打开软件 🎉 🎉 🎉 🎉')
          }
        }
      })
    }
    /** 核心逻辑 e */

  },
  mounted() {
    this.setDefaultPath()
    this.getVersion()
  }
}).$mount('#app')
