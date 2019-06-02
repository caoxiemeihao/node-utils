const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const { getGithubData, exist_dir_file } = require('./utils')
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

/* 19-06-02 数据提取
const workbook = XLSX.readFile(path.join(__dirname, './xlsx/定制商品表格.xls'))
const firstSheetName = workbook.SheetNames[0]
const sheetJsonData = workbook.Sheets[firstSheetName]

// console.log(sheetJsonData)

const expectedKeys = {} // { OrderNumber: 'B', SKU: 'C', Attachment: 'S' }
Object.keys(sheetJsonData)
  .forEach(item => {
    if ('OrderNumber' === sheetJsonData[item].v)
      expectedKeys.OrderNumber = item.substr(0, 1)
    if ('SKU' === sheetJsonData[item].v)
      expectedKeys.SKU = item.substr(0, 1)
    if ('Attachment' === sheetJsonData[item].v)
      expectedKeys.Attachment = item.substr(0, 1)
  })

// console.log(expectedKeys)

const expectedArr = []
const keyStartStr = Object.keys(expectedKeys).map(key => expectedKeys[key]) // [ 'B', 'C', 'S' ]
let itemJson = {}
Object.keys(sheetJsonData)
  .forEach(item => {
    if (
      keyStartStr.includes(item.substr(0, 1)) &&
      !Object.keys(expectedKeys).includes(sheetJsonData[item].v) // 去掉第一行标题
    ) {
      if (item.startsWith(expectedKeys.OrderNumber))
        itemJson.OrderNumber = sheetJsonData[item].v
      if (item.startsWith(expectedKeys.SKU))
        itemJson.SKU = sheetJsonData[item].v
      if (item.startsWith(expectedKeys.Attachment))
        itemJson.Attachment = JSON.parse(sheetJsonData[item].v)[0].thirdPardMessage[0].value
        // '[{"thirdPardMessage":[{"name":"_uploadery_1","value":"https://uploadery.s3.amazonaws.com/meta-charms/f6de9657-aa6f2151ed151e9037f575519a6ad368.jpg"}],"type":1,"customMessgae":{"podType":1,"zone":{"front":{"showimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/5392159987651.jpg","editimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/2329113007948.png","podtype":"picandtext"}}}}]'

      if (Object.keys(itemJson).length === keyStartStr.length) {
        // item 装满了，存一条数据
        expectedArr.push(itemJson)
        itemJson = {}
      }
    }
  })

console.log(expectedArr)

fs.writeFileSync(path.join(__dirname, './xlsx/提取后的数据.json'), JSON.stringify(expectedArr), 'utf8')
*/

// 19-06-02 检测文件夹、文件是否存在
// console.log(exist_dir_file('./xlsx/download.png'))

