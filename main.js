const {app, BrowserWindow, ipcMain, dialog, remote } = require('electron')
const path = require("path");
const url = require("url");
const fs = require('fs')

const AdmZip = require('adm-zip')
const exec = require('child_process').execFile;
require('electron-reload')(`${__dirname}/dist`)
let win
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// var rootPath = path.join(app.getPath("exe"), '../');
var rootPath = __dirname;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 500,
    backgroundColor: '#ffffff',
    frame: false,
    resizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  win.webContents.openDevTools();

  win.loadURL(
    url.format({
      pathname: path.join( __dirname, '/dist/xLauncher/index.html'),
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
  // win.webContents.openDevTools();
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

ipcMain.on('close', () => {
    app.quit();
})

ipcMain.on('log', (e, data) => {
    console.log(data)
})
ipcMain.handle('unpacking', async (e) => {
    return new Promise((resolve, reject) => {
        try {
            let dir = `${ rootPath }/Game`

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
        }
        catch (ers) {}
    })

})

ipcMain.handle('checkGameVersion', (e, data) => {
    if (!fs.existsSync(`${ rootPath}/Game/gameVersion.txt`)) {

        return false
    } else {
        let result = fs.readFileSync(`${ rootPath }/Game/gameVersion.txt`, {encoding: 'utf8'}).trim()
        if (data === result) {

            return true
        }
    }

    return false
})

ipcMain.handle('getPlayerCharacters', () => {
    var appDataFolder = process.env.APPDATA;
    path.join(appDataFolder, '../IronGate/Valheim/characters/');

    var files = [];
    fs.readdirSync(testFolder, (err, files) => {
        files.forEach(file => {
            if (file.contains('fch') && !file.contains('fch')) {
                files.push(file);
            }
        });
    });

    return files;
})

ipcMain.on('startGame', (event, params) => {
    isRunning('steam.exe', (status) => {
        if (status) {
            var url = `${ rootPath }/Game/Valheim/valheim.exe`;
            // var url = `${ rootPath }/Game/Valheim/valheim.exe` + params;

            // throw new Error(url);

            exec(url, params, () => {});;
        } else {
            const options = {
              title: "Steam Manager",
              message: 'Steam process not found. Запустите Steam.',
            };
        
            dialog.showMessageBox(options)
        }
    })
})


const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }

    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}


