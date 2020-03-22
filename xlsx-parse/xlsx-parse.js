const fs = require('fs')
const path = require('path')
const https = require('https')
const XLSX = require('xlsx')
const request = require('request')
const utils = require('./utils')
const { config } = require('./config')


// ---- 19-11-14 ---- add 兼容 cj、shopify-uploadery
const AttachmentType = { cj: 'cj-compatible', uploadery: 'shopify-uploadery', dropbox: 'dropbox', other: 'other' }

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
            const [error, type, Attachment] = compatible_CJ_Uploadery(sheetJsonData[item].v, item)
            if (error) {
              // utils.errorAlert(`第${item}行下载链接解析失败，不会影响其他的图片下载，点击确定继续\n${error}`)
              utils.recordLog(`---- 第${item}行下载链接解析失败 ----\n${error}`)
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

    const arrReady = arr => {
      process.emit('read-xlsx', arr)
      cb instanceof Function && cb({ cmd: 'read-xlsx', data: arr })
    }

    if (processedArr.find(_ => _.AttachmentType === AttachmentType.dropbox)) {
      compatibleDropbox(processedArr).then(arr => arrReady(arr))
    } else {
      arrReady(processedArr)
    }

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
          cb instanceof Function && cb({
            cmd: 'img-error', data: {
              statusCode: res.statusCode,
              url
            }
          })
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

// dropbox 网盘
function compatibleDropbox(arr) {
  console.log(arr)
  const json = {}
  const _arr = []
  const getHtml = ({ arr, x }) => {
    console.log(x, arr[x])
    https.get(arr[x].Attachment, res => {
      console.log('[dropbox] ->', arr[x].Attachment, res)
      if (res.statusCode !== 200) {
        arr[x].Attachment = ''
        _arr.push(arr[x])
      } else {
        res.on('error', err => {
          arr[x].Attachment = ''
          _arr.push(arr[x])
        }).on('data', chunk => {
          console.log(chunk.toString())
        }).on('end', () => {
          getHtml({ arr, x: ++x })
        })
      }
    }).on('error', err => {
      if (err.code === 'ETIMEDOUT') {
        utils.errorAlert(`无法访问外网\n${JSON.stringify(err)}`)
      } else {
        utils.errorAlert(JSON.stringify(err))
      }
    })
  }
  return new Promise(resolve => {
    // for (let x = 0; x < config.downloadLength)
    for (let x = 0; x < 1; x++) {
      getHtml({ arr, x })
    }
  })
}

// ----------------------------- 解析 -s- -----------------------------
// ---- 19-11-14 ---- add 兼容 cj、shopify-uploadery
function compatible_CJ_Uploadery(Attachment, point) {

  // [error, type, Attachment]
  let result = [null, null, null]

  // 元数据 [_uploadery_1:https://uploadery.s3.amazonaws.com/meta-charms/b7e878ee-imagepng_0.png;]
  // [key:value;key:value;] 数据中可能有换行
  const isCj = /^\[((.|\n)+:(.|\n)+;)+\]$/.test(Attachment)

  // 元数据 [{"thirdPardMessage":[{"name":"_uploadery_1","value":"https://uploadery.s3.amazonaws.com/meta-charms/f6de9657-aa6f2151ed151e9037f575519a6ad368.jpg"}],"type":1,"customMessgae":{"podType":1,"zone":{"front":{"showimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/5392159987651.jpg","editimgurl":"https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/2329113007948.png","podtype":"picandtext"}}}}]
  const isUploadery = Attachment.includes('thirdPardMessage')

  // 元数据 [{"image":"https://www.dropbox.com/s/85vnufe2a6hoi82/Order%20%23%209983%20-%20photo.jpg?dl=0"}]
  const isDropbox = Attachment.includes('www.dropbox.com')

  try {
    if (isCj) {
      result[1] = AttachmentType.cj
      result[2] = Attachment.substring(1, Attachment.length - 1)
        .split(';')
        .map(_ => {
          if (_.includes('download.html')) {
            // 兼容 html 形式的链接 20-03-05
            // https://cdn.shopify.com/s/files/1/0033/4807/0511/files/download.html?id=610f9743-fad7-420f-bfa9-b483643e628d&uu=9ee77182-2429-4314-ad13-7d5919c07a09&mo=&fi=T0ZGSUNJQUwgMS5wbmc=&image=true
            const r = _.match(/(?<=(&uu=)).*(?=(&mo=))/)
            return Array.isArray(r)
              // 根据分析页面拼装出来的链接，貌似可用。愿万事大吉 ^_^
              ? `https://cdn.getuploadkit.com/${r[0]}/-/preview/900x900/OFFICIAL%201.png`
              : null
          } else {
            // 图片链接
            const r = _.match(/https?:\/\/.+\.(png|jpe?g)/)
            return Array.isArray(r) ? r[0] : null
          }
        })
        .filter(_ => _)
    } else if (isUploadery) {
      result[1] = AttachmentType.uploadery
      result[2] = JSON.parse(Attachment).map(_ => _.thirdPardMessage[0].value)
    } else if (isDropbox) {
      result[1] = AttachmentType.dropbox
      result[2] = JSON.parse(Attachment).map(_ => _.image)
    } else {
      throw AttachmentType.other
    }
  } catch (e) {
    result[0] = Attachment
    console.groupCollapsed('Attachment解析报错')
    console.log(`Attachment [${point}]:`, Attachment)
    console.warn(e.stack)
    console.groupEnd()
  } finally {
    return result
  }
}
// ----------------------------- 解析 -e- -----------------------------

module.exports = {
  parse,
  downloadIMG,
  AttachmentType,
}
