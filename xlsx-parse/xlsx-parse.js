const fs= require('fs')
const path = require('path')
const XLSX = require('xlsx')
const request = require('request')
const utils = require('./utils')


function parse(path, cb) {
  try {
    /**
    * SheetNames 代表一个excel中有几张表
    * Sheets JSON格式数据集合，key为行、列拼装，value为单元格数据
    * Strings 数组格式数据集合
    **/

    const workbook = XLSX.readFile(path)
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

    const expectedArr = [
      // {OrderNumber: "#2812", SKU: "CJJJJTCF00488-Heart-Blue box*1;@1", Attachment: "https://uploadery.s3.amazonaws.com/meta-charms/e49b772a-IMG_49911.jpg"}
    ]
    const keyStartStr = Object.keys(expectedKeys).map(key => expectedKeys[key]) // [ 'B', 'C', 'S' ]
    let itemJson = {}

    Object.keys(sheetJsonData)
    .forEach((item, idx) => {
      if (
        keyStartStr.includes(item.substr(0, 1)) &&
        !Object.keys(expectedKeys).includes(sheetJsonData[item].v) // 去掉第一行标题
      ) {
        if (item.startsWith(expectedKeys.OrderNumber))
          itemJson.OrderNumber = sheetJsonData[item].v
        if (item.startsWith(expectedKeys.SKU))
          itemJson.SKU = sheetJsonData[item].v
        if (item.startsWith(expectedKeys.Attachment)) {
          try {
            // 元数据 -> [{"thirdPardMessage":[{"name":"_uploadery_1","value":"https://uploadery.s3.amazonaws.com/meta-charms/f6de9657-aa6f2151ed151e9037f575519a6ad368.jpg"}],"type":1,"customMessgae":{"podType":1,"zone":{"front":{"showimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/5392159987651.jpg","editimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/2329113007948.png","podtype":"picandtext"}}}}]
            itemJson.Attachment = JSON.parse(sheetJsonData[item].v)[0].thirdPardMessage[0].value
          } catch (e) {
            itemJson.Attachment = null
            console.warn(item, sheetJsonData[item])
            utils.errorAlert(`第${item}行下载链接解析失败，不会影响其他的图片下载，点击确定继续`)
          }
        }

        if (Object.keys(itemJson).length === keyStartStr.length) {
          // item 装满了，存一条数据
          expectedArr.push(itemJson)
          itemJson = {}
        }
      }
    })

    // console.log(expectedArr)

    cb instanceof Function && cb({ cmd: 'read-xlsx', data: expectedArr })
  } catch (e) {
    throw e
  }
}

function downloadIMG({ url, filename, cb }) {
  try {
    request
    .get(url)
    .on('response', res => {
      // console.log(res.statusCode, res.headers['content-type'])
      utils.log.green(res.statusCode, url)
      if (+res.statusCode !== 200) {
        cb instanceof Function && cb({ cmd: 'img-error', data: {
          statusCode: res.statusCode,
          url
        }})
      }
    })
    .on('data', buffer => {
      // console.log(buffer)
      cb instanceof Function && cb({ cmd: 'img-data', data: buffer })
    })
    .on('end', _ => {
      // console.log(ev, 'end')
      cb instanceof Function && cb({ cmd: 'img-end', data: '' })
    })
    .on('error', e => {
      utils.log.error(e)
    })
    .pipe(fs.createWriteStream(filename))
  } catch (e) { throw e }
}

function getKeys(json, field) {
  return Object.keys(json).filter(key => key.startsWith(field))
}

module.exports = {
  parse,
  downloadIMG,
}
