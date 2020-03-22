const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const https = require('https')
const http = require('http')

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

const expectedArr = [
  // {OrderNumber: "#2812", SKU: "CJJJJTCF00488-Heart-Blue box*1;@1", Attachment: "https://uploadery.s3.amazonaws.com/meta-charms/e49b772a-IMG_49911.jpg"}
]
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


/* 20-03-22
const writeable = fs.createWriteStream(path.join(__dirname, 'test.jpeg'))
const url = 'https://uc261ef195a13f1577c70178591c.previews.dropboxusercontent.com/p/thumb/AAtMa54tEzNtKVFEmO4WcI1yi-HKeOxKPWU1e1sq1cGm4m4l-vckhMFc8M0wYHElNG15KhtERhL86OPE--fzkF9Ht8MxsistZwaKB7DPCUeFJevf45IyZp6qWBDnplkEL0dUvirJ4ye1PKRglcVFBVrFtqEWic3YZXMHLdXZ126rpJ9izcHWaqgdTs7c92vVhYUN27en3xK-TT_TBLhZ24LDqYDlKdgFLYcbUdJeeuFjYcd4YdqlumoI5ySj8Pnaa6kQ8lKLsFVo1c7OzaWYhd8Czd2c_XiIPOPhGZp5evz8qwPLHKFKkOZqziUmdeGamWmJC21_tviyJATnsBV7WzkTJh7knTuTAiiE76BNTKbTGtJ1b7oIEoxFdSooYbooualnyGCGgHB8bG8TprFELO1t/p.jpeg?size=1024x768'
https.request(url, res => {
  res.on('data', chunk => {
    console.log(chunk)
    writeable.write(chunk)
  })
  res.on('end', () => {
    console.log('----', 'end', '----')
    writeable.close()
  })
}).on('error', e => {
  console.log(e, '\n', '+++++++++++++++++++++')
}).end() */

const getUrl = 'https://www.dropbox.com/s/85vnufe2a6hoi82/Order%20%23%209983%20-%20photo.jpg?dl=0'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
const opt = {
  port: 80,
  host: '159.138.5.222',
  method: 'GET',
  path: 'https://www.dropbox.com/s/85vnufe2a6hoi82/Order%20%23%209983%20-%20photo.jpg?dl=0',
  path: 'http://www.baidu.com',
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, sdch, br',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6',
    'Cache-Control': 'max-age=0',
    'Cookie': '_ga=GA1.2.1653214693.1476773935; VISITOR_INFO1_LIVE=T3BczuPUIQo; SID=5QR6XEldVgveXzFtqjIcD480cHE18gBRd3xPo398vndcc5JNxOAZ-TgVp5jQx3CR-ePvgA.; HSID=APr2I8UwM-A-Lypbd; SSID=Ap4H3Td1nrV__-9tN; APISID=8bHyFV90pNBU5Z9p/A2DlJa2MyJLL4-RKP; SAPISID=4tZf4GDX7Dt5bNAt/A5vhaZe_DLzn-ECul; CONSENT=YES+CN.zh-CN+20160904-14-0; YSC=XVHk_pArWhE; PREF=cvdm=grid&f1=50000000&f6=1&f5=30&al=zh-CN&gl=HK',
    'Upgrade-insecure-requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
    'X-Chrome-Uma-Enabled': '1',
    'X-Client-Data': 'CJa2yQEIorbJAQjBtskBCKmdygE=',
    'Connection': 'keep-alive'
  },
}
http.request(opt, res => {
  res.on('error', err => {
    console.log(err)
  }).on('data', chunk => {
    console.log(chunk.toString())
  }).on('end', () => {
    console.log('----', 'end', '----')
  })
}).on('error', err => {
  console.log(err)
}).end()
