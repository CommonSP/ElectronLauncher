const {app, BrowserWindow, ipcMain} = require('electron')
const path = require("path");
const url = require("url");
const fs = require('fs')

const AdmZip = require('adm-zip')
const exec = require('child_process').execFile;
require('electron-reload')(`${__dirname}/dist`)
let win
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 600,
    backgroundColor: '#ffffff',
    frame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/dist/xLauncher/index.html'),
      protocol: "file:",
      slashes: true
    })
  )

  win.on('closed', () => {
    win = null
  })


}

app.whenReady().then(() => {
  createWindow()
  win.webContents.openDevTools();
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('log', (e, data) => {
  console.log(data)
})
ipcMain.handle('unpacking', async (e) => {
  return new Promise((resolve, reject) => {
    let dir = `${__dirname}/Game`
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    let zip = new AdmZip('game.zip')
    zip.extractAllToAsync(dir, true, (err) => {
      if (err) {
        reject(false)
      }
      resolve(true)
    })

  })

})

ipcMain.handle('checkGameVersion', (e, data) => {
  if (!fs.existsSync(`${__dirname}/gameVersion.txt`)) {
    return false
  } else {
    let result = fs.readFileSync(`${__dirname}/gameVersion.txt`, {encoding: 'utf8'}).trim()
    if (data === result) {
      return true
    }
  }
  return false

})

ipcMain.on('startGame', (e)=>{


})



