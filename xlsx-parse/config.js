exports.config = {
  mainWindow: {
    x: 4,
    y: 9,
  },
  env: (() => {
    if (process.execPath.includes('electron.exe')) {
      // 开发路径
      // process.execPath: "D:\workspace\github\node-utils\xlsx-parse\node_modules\electron\dist\electron.exe"
      // 运行路径
      // process.execPath: "D:\workspace\github\node-utils\xlsx-parse\dist\excel-utils-win32-x64\excel-utils.exe"

      return 'development'
    } else {
      return 'production'
    }
  })(),
}
