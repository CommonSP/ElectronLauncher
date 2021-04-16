import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ElectronService } from 'ngx-electron';
import { autoUpdater } from 'electron-updater';

const fs = (<any>window).require('fs');
const path = (<any>window).require("path");

export interface IServerInfo {
    Name: string;
    TrackerUrl: string;
    IpAddress: string;
}

export interface ILauncherConfig {
    UrlGameDataPath: string;
    LauncherVersion: string;
    GameVersion: string;

    ServerList: IServerInfo[]
}

@Injectable({
    providedIn: 'root',
})
export class GameService {
    constructor(
        private http: HttpClient,
        private electronService: ElectronService
    ) {
        const log = require('electron-log')
        log.transports.file.level = "debug"
        autoUpdater.logger = log
        autoUpdater.checkForUpdatesAndNotify();
    }

    public urlGameDataPath: string;
    public launcherVersion: string;
    public gameVersion: string;

    getLaucnherConfig(): Promise<ILauncherConfig> {
        return new Promise<ILauncherConfig>((resolve, reject) => {
            this.http.get<ILauncherConfig>('https://pastebin.com/raw/KEp31cuY').subscribe(result => {
                this.urlGameDataPath = result.UrlGameDataPath;
                this.launcherVersion = result.LauncherVersion;
                this.gameVersion = result.GameVersion;

                resolve(result);
            }, error => {
                reject(error);
            });
        })
    }

    getGameFiles(): Observable<HttpEvent<any>> {
        return this.http.get(this.urlGameDataPath, {
            responseType: 'arraybuffer',
            reportProgress: true,
            observe: 'events',
        });
    }

    saveGameFiles(data: any): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.writeFile(`game.zip`, Buffer.from(data, 'binary'), (error) => {
                if (error) {
                    reject(error);
                } else {
                    this.electronService.ipcRenderer.invoke('unpacking').then((value) => {
                        if (value) {
                            fs.writeFileSync(`Game/gameVersion.txt`, this.gameVersion);
                        }

                        resolve(true);
                    }).catch((error) => {
                        reject(error);
                    });
                }
            });
        });
    }

    checkGameVersion(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!fs.existsSync(`Game/gameVersion.txt`)) {
                return resolve(false);
            } else {
                let gameVersion = fs.readFileSync(`Game/gameVersion.txt`, { encoding: 'utf8' }) .trim();
                return resolve(this.gameVersion === gameVersion);
            }
        });
    }

    checkAdminRights(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.electronService.ipcRenderer.invoke('checkOnAdminRights').then((value) => {
                resolve(value);
            })
            .catch((err) => {
                resolve(false);
            });
        });
    }
    
    checkIsGameInstalled(): boolean {
        return fs.existsSync(`Game/Valheim/valheim.exe`);
    }

    startGame(server: string) {
        var params = [];

        if (server) {
            params.push('server');
            params.push(server);
        }

        this.electronService.ipcRenderer.send('startGame', params);
    }

    openGameFolder() {
        this.electronService.ipcRenderer.send('openGameFolder');
    }

    openLogFolder() {
        this.electronService.ipcRenderer.send('openLogFolder');
    }
}
