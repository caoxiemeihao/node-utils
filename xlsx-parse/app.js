const fs= require('fs')
const path = require('path')
const XLSX = require('xlsx')


/**
 * SheetNames 代表一个excel中有几张表
 * Sheets JSON格式数据集合，key为行、列拼装，value为单元格数据
 * Strings 数组格式数据集合
 **/

let filename = path.join(__dirname, './xlsx/定制商品表格.xls')
let workbook = XLSX.readFile(filename)
let firstSheetName = workbook.SheetNames[0]
let sheetJsonData = workbook.Sheets[firstSheetName]
let col_name = getKeys(sheetJsonData, 'B')  // 命名列
let col_urls = getKeys(sheetJsonData, 'S')  // 数据链接列
let data = (_ => col_urls.map((item, idx) => ({
  name: sheetJsonData[col_name[idx]].v,
  urls: sheetJsonData[col_urls[idx]].v,
})))();



console.log(data)


fs.writeFileSync(
  path.join(__dirname, './xlsx/提取后的数据.json'),
  JSON.stringify(data)
)


function getKeys(json, field) {
  return Object.keys(json).filter(key => key.startsWith(field))
}


