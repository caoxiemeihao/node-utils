// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const OS = require('os')
const { config } = require('config')

// -----------------------------------------------
const client = require('electron-connect').client
// -----------------------------------------------

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...{
      width: 800,
      height: 600,
      // x: 4,
      // y: 9,
      webPreferences: {
        nodeIntegration: true
      }
    },
    ...config.mainWindow
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  init()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// ---------------------------------------
// app.on('ready', createWindow)
app.on('ready', () => {
  // Connect to server process
  createWindow()
  client.create(mainWindow)  // 刷新监听
})
// ---------------------------------------

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// -----------------------------------------------------------------------------
function init() {
  toggleDevTools(true)
  ipcMain.on('homedir', event =>event.sender.send('homedir', OS.homedir()))
  // setTimeout(() => mainWindow.webContents.send('homedir', OS.homedir()), 1000)
}


// 切换 DevTools
function toggleDevTools(bool) {
  if (mainWindow) {
    if (bool) {
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.webContents.closeDevTools()
    }
  }
}
// -----------------------------------------------------------------------------
