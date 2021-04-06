import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ElectronService } from 'ngx-electron';
import { map } from 'rxjs/operators';

const fs = (<any>window).require('fs');
const path = (<any>window).require("path");

export interface IServerInfo {
    Name: string;
    TrackerUrl: string;
    IpAddress: string;
}

export interface ILauncherConfig {
    UrlGameDataPath: string;
    UrlLauncherVersionPath: string;
    UrlGameVersionPath: string;

    ServerList: IServerInfo[]
}

@Injectable({
    providedIn: 'root',
})
export class DownloadFilesService {
    constructor(
        private http: HttpClient,
        private electronService: ElectronService
    ) { }

    launcherVersion = 'ValheimXv1' || process.env.LAUNCHER_V;

    urlGameDataPath = 'http://valheim.by/upload/Valheim.zip';
    urlLauncherVersionPath = 'http://valheim.by/upload/lversion.txt';
    urlGameVersionPath = 'http://valheim.by/upload/gversion.txt';

    getLaucnherConfig(): Promise<ILauncherConfig> {
        return new Promise<ILauncherConfig>((resolve, reject) => {
            this.http.get<ILauncherConfig>('https://pastebin.com/raw/KEp31cuY').subscribe(result => {
                this.urlGameDataPath = result.UrlGameDataPath;
                this.urlLauncherVersionPath = result.UrlLauncherVersionPath;
                this.urlGameVersionPath = result.UrlGameVersionPath;

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
            fs.writeFile(`game.zip`, new Buffer(data, 'binary'), (err) => {
                if (err) {
                    console.error(err);
                    reject();
                } else {
                    this.electronService.ipcRenderer
                        .invoke('unpacking')
                        .then((value) => {
                            this.http
                                .get(this.urlGameVersionPath, { responseType: 'text' })
                                .subscribe((data) => {
                                    fs.writeFileSync(`Game/gameVersion.txt`, data);
                                    resolve(true);
                                });
                        })
                        .catch((err) => {
                            console.error(err);
                            reject();
                        });
                }
            });
        });
    }

    checkLauncherVersion(): Observable<boolean> {
        if (!fs.existsSync('./Game')) {
            fs.mkdirSync('./Game');
        }

        return this.http
            .get(this.urlLauncherVersionPath, { responseType: 'text' })
            .pipe(
                map((version) => {
                    return version === this.launcherVersion;
                })
            );
    }

    checkIsGameInstalled(): boolean {
        return fs.existsSync(`Game/Valheim/valheim.exe`);
    }

    checkGameVersion(): Observable<boolean> {
        return this.http
            .get(this.urlGameVersionPath, { responseType: 'text' })
            .pipe(
                map((version) => {
                    if (!fs.existsSync(`Game/gameVersion.txt`)) {
                        return false;
                    } else {
                        let result = fs
                            .readFileSync(`Game/gameVersion.txt`, { encoding: 'utf8' })
                            .trim();
                        if (version === result) {
                            return true;
                        }
                    }

                    return false;
                })
            );
    }

    startGame(character: string, server: string) {
        var params = [];

        if (character) {
            params.push('character');
            params.push(character);
        }
        if (server) {
            params.push('server');
            params.push(server);
        }

        this.electronService.ipcRenderer.send('startGame', params);
    }

    getPlayerCharacters() {
        var appDataFolder = process.env.APPDATA;
        appDataFolder = path.join(appDataFolder, '../LocalLow/IronGate/Valheim/characters');

        var characters = [];
        fs.readdirSync(appDataFolder).forEach((file) => {
            if (file.includes('fch') && !file.includes('old')) {
                characters.push(file.split('.')[0]);
            }
        });

        return characters;
    }
}
