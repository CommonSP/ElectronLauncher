const { app, BrowserWindow, ipcMain, dialog, shell, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require("path");
const url = require("url");
const fs = require('fs')
const isAdmin = require('is-admin');

const AdmZip = require('adm-zip')
const exec = require('child_process').execFile;
require('electron-reload')(`${__dirname}/dist`)
let win
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

var isDevBuild = true;

var rootPath = '';
if (isDevBuild) {
    rootPath = __dirname;
} else {
    rootPath = path.join(app.getPath("exe"), '../');
}

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

    if (isDevBuild) {
        win.webContents.openDevTools();
    }

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

    var appIcon = new Tray('./icon.png');
}

app.commandLine.appendSwitch("disable-http-cache");

app.whenReady().then(() => {
    createWindow();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

ipcMain.on('close', () => {
    app.quit();
});

ipcMain.handle('unpacking', async (e) => {
    return new Promise((resolve, reject) => {
        try {
            let dir = `${rootPath}/Game`

            // Remove old Data
            if (fs.existsSync(dir)) {
                fs.rmdirSync(dir, { recursive: true });
            }

            fs.mkdirSync(dir)

            // if (fs.existsSync('game.zip')) {
            //     fs.unlinkSync('game.zip');
            // }

            let zip = new AdmZip('game.zip')
            zip.extractAllToAsync(dir, true, (err) => {
                if (err) {
                    onError(error);

                    if (fs.existsSync('game.zip')) {
                        fs.unlinkSync('game.zip');
                    }
                    
                    resolve(false);
                } else {
                    if (fs.existsSync('game.zip')) {
                        fs.unlinkSync('game.zip');
                    }
    
                    resolve(true)
                }
            });
        } catch (error) {
            onError(error);

            reject(error);
        }
    })

})

ipcMain.handle('checkOnAdminRights', (e, data) => {
    return new Promise((resolve, reject) => {
        isAdmin().then(result => {
            resolve(result);
        }, error => {
            reject(error);
        })
    });
});


ipcMain.handle('checkGameVersion', (e, data) => {
    if (!fs.existsSync(`${rootPath}/Game/gameVersion.txt`)) {

        return false
    } else {
        let result = fs.readFileSync(`${rootPath}/Game/gameVersion.txt`, { encoding: 'utf8' }).trim()
        if (data === result) {

            return true
        }
    }

    return false
});


ipcMain.on('startGame', (event, params) => {
    isProcessRunning('steam.exe', (status) => {
        if (status) {
            var url = `${rootPath}/Game/Valheim/valheim.exe`;

            exec(url, params, () => { });;
        } else {
            const options = {
                title: "Steam Manager",
                message: 'Steam process not found. Запустите Steam.',
            };

            dialog.showMessageBox(options)
        }
    });
});

ipcMain.on('openGameFolder', () => {
    shell.openPath(path.join(rootPath, '/Game/Valheim'));
});

ipcMain.on('openLogFolder', () => {
    shell.openPath(path.join(process.env.APPDATA, '../Local/Temp/IronGate/Valheim/Crashes'));
});



const onError = (error) => {
    const options = {
        title: "Ошибка",
        message: `${error.message}`,
    };

    dialog.showMessageBox(options)
};

const isProcessRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32': cmd = `tasklist`; break;
        case 'darwin': cmd = `ps -ax | grep ${query}`; break;
        case 'linux': cmd = `ps -A`; break;
        default: break;
    }

    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}


