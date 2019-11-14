const fs= require('fs')
const path = require('path')
const XLSX = require('xlsx')
const request = require('request')
const utils = require('./utils')


// ---- 19-11-14 ---- add 兼容 cj、shopify-uploadery
const AttachmentType = { cj: 'cj-compatible', uploadery: 'shopify-uploadery' }

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

    const expectedKeys = {} // { OrderNumber: 'B', SKU: 'C', quantity: 'E', Attachment: 'S' }

    Object.keys(sheetJsonData)
      .forEach(item => {
        if ('OrderNumber' === sheetJsonData[item].v) {
          expectedKeys.OrderNumber = item.substr(0, 1)
        }
        if ('SKU' === sheetJsonData[item].v) {
          expectedKeys.SKU = item.substr(0, 1)
        }
        if ('quantity' === sheetJsonData[item].v) { // 19-11-14
          expectedKeys.quantity = item.substr(0, 1)
        }
        if ('Attachment' === sheetJsonData[item].v) {
          expectedKeys.Attachment = item.substr(0, 1)
        }
      })

    // console.log(expectedKeys)

    const expectedArr = [
      // {OrderNumber: "#2812", SKU: "CJJJJTCF00488-Heart-Blue box*1;@1", Attachment: "https://uploadery.s3.amazonaws.com/meta-charms/e49b772a-IMG_49911.jpg"}
    ]
    const startStrKeys = Object.keys(expectedKeys).map(key => expectedKeys[key]) // [ 'B', 'C', 'E', 'S' ]
    const extraKey = ['AttachmentType'] // 19-11-14 扩展字段
    let itemJson = {}

    Object.keys(sheetJsonData)
      .forEach((item, idx) => {
        if (
          startStrKeys.includes(item.substr(0, 1)) &&
          !Object.keys(expectedKeys).includes(sheetJsonData[item].v) // 去掉第一行标题
        ) {
          if (item.startsWith(expectedKeys.OrderNumber)) {
            itemJson.OrderNumber = sheetJsonData[item].v
          }
          if (item.startsWith(expectedKeys.SKU)) {
            itemJson.SKU = sheetJsonData[item].v
          }
          if (item.startsWith(expectedKeys.quantity)) { // 19-11-14
            itemJson.quantity = sheetJsonData[item].v
          }
          if (item.startsWith(expectedKeys.Attachment)) {
            const [error, type, Attachment] = compatible_CJ_Uploadery(sheetJsonData[item].v)
            if (error) {
              // utils.errorAlert(`第${item}行下载链接解析失败，不会影响其他的图片下载，点击确定继续\n${error}`)
              console.warn(error)
              utils.recordLog(`第${item}行下载链接解析失败`)
            }
            itemJson.AttachmentType = type
            itemJson.Attachment = Attachment
          }

          if (Object.keys(itemJson).length === startStrKeys.length + extraKey.length) {
            // item 装满了，存一条数据
            expectedArr.push(itemJson)
            itemJson = {}
          }
        }
      })

    // ---- 19-06-08 mod 支持多 SKU --S--
    let processedArr = []

    expectedArr.forEach(row => {
      try {
        if (row.Attachment) { // 跳过脏数据
          let tmpArr = []
          let skuArr = row.SKU.split(';')

          if (row.Attachment.length === 1) { // 单个 SKU
            tmpArr = [{ ...row, SKU: row.SKU.split(';')[0], Attachment: row.Attachment[0] }]
          } else {                           // 多个 SKU [拉平]
            tmpArr = row.Attachment.map((imgUrl, idx) => ({
              OrderNumber: `${row.OrderNumber}-${idx + 1}`,
              SKU: skuArr[idx],
              Attachment: imgUrl,
              group: row.OrderNumber,
            }))
          }

          processedArr = processedArr.concat(tmpArr)
        }
      } catch (e) {
        console.error(`${JSON.stringify(row)}\nSKU加工失败，不会影响其他的图片下载`)
      }
    })
    // ---- 19-06-08 mod 支持多 SKU --E--

    cb instanceof Function && cb({ cmd: 'read-xlsx', data: processedArr })
  } catch (e) {
    throw e
  }
}

// ---- 19-11-14 ---- add 兼容 cj、shopify-uploadery
function compatible_CJ_Uploadery(Attachment) {

  // [error, type, Attachment]
  let result = [null, null, null]

  // [key:value;key:value;]
  const isCj = /^\[(\w+:.+;)+\]$/.test(Attachment)

  try {
    if (isCj) {
      result[1] = AttachmentType.cj
      // 元数据 CJ
      // [_uploadery_1:https://uploadery.s3.amazonaws.com/meta-charms/b7e878ee-imagepng_0.png;]
      result[2] = Attachment.substring(1, Attachment.length - 1)
        .split(';')
        .map(_ => {
          const r = _.match(/https?:\/\/.+\.(png|jpe?g)/)
          return Array.isArray(r) ? r[0] : null
        })
        .filter(_ => _)
    } else {
      result[1] = AttachmentType.uploadery
      // 元数据 shopify
      // [{"thirdPardMessage":[{"name":"_uploadery_1","value":"https://uploadery.s3.amazonaws.com/meta-charms/f6de9657-aa6f2151ed151e9037f575519a6ad368.jpg"}],"type":1,"customMessgae":{"podType":1,"zone":{"front":{"showimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/5392159987651.jpg","editimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/2329113007948.png","podtype":"picandtext"}}}}]
      result[2] = JSON.parse(Attachment).map(_ => _.thirdPardMessage[0].value)
    }
  } catch (e) {
    result[0] = e.stack
    console.warn(Attachment, '\n', e.stack)
  } finally {
    return result
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
  AttachmentType,
}
