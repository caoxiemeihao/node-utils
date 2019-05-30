// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const IPC = require('electron').ipcRenderer
const XLSX = require('./xlsx-parse')
const utils = require('./utils')

const vm = new Vue({
  data: {},
  methods: {
    uploadFile() {
      utils.readLocalFile().then(res => {
        console.log(res)
      })
    }
  }
}).$mount('#app')
