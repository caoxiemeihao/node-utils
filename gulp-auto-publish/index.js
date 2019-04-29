const fs = require('fs');

let targetPath = './dist/';
let indexHtml;
let reg = new RegExp('</head>');
let replaceHeader = `
      <style>
        .loading { display: flex; align-items: center; justify-content: center; position: absolute; top: 0; right: 0; left: 0; bottom: 0; }
      </style>
  </head>
  `;

readFile({ filePath: './index.html', fn: data => {
  generateNewFile({ target: targetPath, name: 'index.html', data });
}});

function readFile({ filePath, fn }) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`---- 读取文件失败 ----\n`, err, `\n---- 读取文件失败 ----`);
    } else {
      indexHtml = data.toString();
      indexHtml = indexHtml.replace(reg, replaceHeader);
      fn && fn(indexHtml);
    }
  });
}

function generateNewFile({ target, name, data, fn }) {
  fs.writeFile(target + name, data, err => {
    if (err) {
      console.error(`---- 写入文件失败 ----\n`, err, `\n---- 写入文件失败 ----`);
    } else {
      console.log(`**** 文件 ${name} 写入成功 ****`);
      fn && fn(name);
    }
  })
}
