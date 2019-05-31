const fs= require('fs')
const path = require('path')
const XLSX = require('xlsx')
const request = require('request')


function parse(path, cb) {
  /**
  * SheetNames 代表一个excel中有几张表
  * Sheets JSON格式数据集合，key为行、列拼装，value为单元格数据
  * Strings 数组格式数据集合
  **/

  // let filename = path.join(__dirname, './xlsx/定制商品表格.xls')
  // let testUrl = 'https://cc-west-usa.oss-us-west-1.aliyuncs.com/20190225/2329113007948.png'
  let filename = path
  let workbook = XLSX.readFile(filename)
  let firstSheetName = workbook.SheetNames[0]
  let sheetJsonData = workbook.Sheets[firstSheetName]
  let col_name = getKeys(sheetJsonData, 'B')  // 命名列
  let col_urls = getKeys(sheetJsonData, 'S')  // 数据链接列
  let data = (_ => col_urls.map((item, idx) => ({
    name: sheetJsonData[col_name[idx]].v,
    urls: sheetJsonData[col_urls[idx]].v,
  })))();


  cb instanceof Function && cb({ cmd: 'read-xlsx', data })
  // console.log(data)


  // fs.writeFileSync(
  //   path.join(__dirname, './xlsx/提取后的数据.json'),
  //   JSON.stringify(data)
  // )
}

function downloadIMG({ url, filename, cb }) {
  request
    .get(url)
    .on('response', res => {
      // console.log(res.statusCode)
      console.log(res.statusCode, res.headers['content-type'])
    })
    .on('data', buffer => {
      // console.log(buffer)
      cb instanceof Function && cb({ cmd: 'img-data', data: buffer })
    })
    .on('end', _ => {
      // console.log(ev, 'end')
      cb instanceof Function && cb({ cmd: 'img-end', data: '' })
    })
    // .pipe(fs.createWriteStream(path.join(__dirname, './xlsx/download.png')))
    .pipe(fs.createWriteStream(filename))
}

function getKeys(json, field) {
  return Object.keys(json).filter(key => key.startsWith(field))
}

module.exports = {
  parse,
  downloadIMG,
}
