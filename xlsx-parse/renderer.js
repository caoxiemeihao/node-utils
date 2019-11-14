// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron')
const XLSX = require('./xlsx-parse')
const utils = require('./utils')
const path = require('path')
const fs = require('fs')
const { getVersion, updateApp } = require('./version')

let downloadPath = null
const vm = new Vue({
  data: {
    downloadPath: (downloadPath = window.localStorage.getItem('download-path') || ''),
    homedir: '',
    logInfo: '',
    local_version: '0.0.0',
    remote_version: '0.0.0',
    downloadArr: [],
    downloadActArr: [],
    startedDownload: false,
    showDownloadPanel: false,
  },
  computed: {
    // downloadArrFilter() { }
  },
  methods: {
    chooseSaveFilePath(start) {
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
          window.localStorage.setItem('download-path', (downloadPath = vm.downloadPath = res[0]))
          if (start === 'start') this.startDownload()
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
      if (!this.downloadPath) {
        this.chooseSaveFilePath('start')
        return
      }
      if (!vm.downloadArr.length) {
        window.alert('还没有上传文件哦~亲 ^_^')
        return
      }

      if (vm.startedDownload === true) {
        window.alert('图片下载还没有全部完成~亲 ^_^\n需要重新下载，点击 刷新 按钮')
      } else {
        vm.startedDownload = true
        vm.downloadIMG(vm.downloadArr.filter(item => item.pick))
      }
    },
    toggleDownloadPanel() {
      this.showDownloadPanel = !this.showDownloadPanel
    },
    toggleDevTools() {
      ipcRenderer.send('toggle dev tools')
    },

    /** ============== 核心逻辑 ============== s */
    uploadFile() {
      utils.readLocalFile().then(res => {
        process.emit('file uploaded')
        console.log('获取文件 ->', res[0])
        XLSX.parse(res[0].path, ({ cmd, data }) => {
          console.log(cmd, vm.logInfo = `🍡 读取完成，等待下载...`, JSON.parse(JSON.stringify(data)))
          // data = [{OrderNumber: "#2812", SKU: "CJJJJTCF00488-Heart-Blue box*1;@1", Attachment: "https://uploadery.s3.amazonaws.com/meta-charms/e49b772a-IMG_49911.jpg"}]
          vm.downloadArr = data.map((item, idx) => ({ ...item, pick: true, idx }))
          // if (cmd === 'read-xlsx') vm.downloadIMG(data) // 读完自动下载
        })
      })
    },
    downloadIMG(arr = []) {
      if (!arr.length) return

      let now = 0

      vm.showDownloadPanel = true
      for (let x = 0; x < config.downloadLength; x++) {
        download(arr[now = x])
      }
      function download(json) {
        if (!json.Attachment) {
          now++
          utils.log.error(`第 ${now} 行数据有问题`)
          utils.recordLog(`第 ${now} 行数据有问题`)
          arr[now] && download(arr[now])

          return
        }

        let arr1
          , dirName
          , sum
          , targetFolder
          , filename

        try {
          arr1 = json.SKU.split(' ') // SKU: "CJJJJTCF00488-Heart-Blue box*1;@1"

          dirName = arr1[0].split('-')[1]
          sum = json.AttachmentType === XLSX.AttachmentType.uploadery // 19-11-14 mod
           ? json.quantity || arr1[1].split('*')[1]
           : json.quantity /** 其實兩者都可以用 quantity */

          // console.log(arr1, dirName, sum)

          targetFolder = `${vm.downloadPath}\\${dirName}\\${sum}`
          utils.exist_dir_file(targetFolder) || fs.mkdirSync(targetFolder, { recursive: true })
          filename = `${targetFolder}\\${json.OrderNumber}${json.Attachment.substring(json.Attachment.lastIndexOf('.'))}`

          // console.log(filename)

          vm.downloadActArr.push(json)
          XLSX.downloadIMG({ url: json.Attachment, filename, cb: ev => {
            if (ev.cmd === 'img-error') {
              now++
              utils.log.error(`第 ${now} 行图片请求失败 \n`, ev.data)
              utils.recordLog(`第 ${now} 行图片请求失败 \n`, ev.data)
              arr[now] && download(arr[now])
              vm.downloadActArr = vm.downloadActArr.map(item => {
                if (item.OrderNumber === json.OrderNumber) item.error = true
                return item
              })
            } else if (ev.cmd === 'img-data') {
              vm.logInfo = `🚀️ [${Math.min(arr.length, now)}/${arr.length}] ${json.OrderNumber} 下载中...`
            } else if (ev.cmd === 'img-end') {
              now++

              vm.logInfo = `🚀️ [${Math.min(arr.length, now)}/${arr.length}] ${json.OrderNumber} 下载中...`
              // console.log(vm.logInfo)
              // 下载完成，从下载队列中去除
              vm.downloadActArr = vm.downloadActArr.filter(item => item.OrderNumber !== json.OrderNumber)
              if (arr[now]) {
                download(arr[now])
              } else {
                if (vm.downloadActArr.length === 0) {
                  // alert('下载完了')
                  vm.logInfo = `🍺 [${Math.min(arr.length, now)}/${arr.length}] 下载完成！`
                  vm.startedDownload = false
                }
              }
            }
          }})
        } catch (e) {
          console.error(`${e}\n 不会影响其他的图片下载`)
          now++
          arr[now] && download(arr[now])
        }
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
    /** ============== 核心逻辑 ============== e */

  },
  mounted() {
    this.setDefaultPath()
    this.getVersion()
  }
}).$mount('#app')

module.exports = {
  getDownloadPath: function() { return downloadPath }
}
