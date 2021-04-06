import {Component, OnInit} from '@angular/core';
import {ElectronService} from 'ngx-electron';
import {DownloadFilesService, IServerInfo} from "./shared/services/download-files.service";
import {HttpEventType} from "@angular/common/http";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface ITrustedServerInfo extends IServerInfo {
    TrustedTrackerUrl: SafeUrl;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    isLauncherVersionValid = false
    isGameInstalled = false;
    isGameVersionValid = false

    isBusy = false;
    isGameLoading = false;
    valueProgressBar = 32;
    gameLoadingMessage = "";

    public characters: string[];
    public serverList: ITrustedServerInfo[];

    public selectedCharacterName: string;
    public selectedServerIp: string;

    public isDataReceived = false;

    public get canInstallGame() {
        return this.isLauncherVersionValid && !this.isGameInstalled && !this.isBusy;
    }

    public get canUpdateGame() {
        return this.isLauncherVersionValid && !this.isGameVersionValid && !this.isBusy;
    }

    public get canStartGame() {
        return this.isLauncherVersionValid && this.isGameVersionValid && !this.isBusy;
    }

    constructor(private electronService: ElectronService,
        private downloadService: DownloadFilesService,
        private sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.downloadService.getLaucnherConfig().then(result => {
            this.serverList = [];
            result.ServerList.forEach(server => {
                const trustedServer: ITrustedServerInfo = {
                    IpAddress: server.IpAddress,
                    Name: server.Name,
                    TrackerUrl: server.TrackerUrl,
                    TrustedTrackerUrl: this.sanitizer.bypassSecurityTrustResourceUrl(server.TrackerUrl)
                };

                this.serverList.push(trustedServer);
            })

            this.chekVersion()

            this.characters = this.downloadService.getPlayerCharacters();

            this.isDataReceived = true;
        })
    }

    closeApp() {
      this.electronService.ipcRenderer.send('close');
    }

    openExternal(url) {
      this.electronService.shell.openExternal(url);
    }

    chekVersion() {
        this.isBusy = true;
        this.downloadService.checkLauncherVersion().subscribe(isLauncherVersionValid => {
            if (isLauncherVersionValid) {
                this.isLauncherVersionValid = isLauncherVersionValid

                this.isGameInstalled = this.downloadService.checkIsGameInstalled();
                if (this.isGameInstalled) {
                    this.downloadService.checkGameVersion().subscribe(isGameVersionValid => {
                        if (isGameVersionValid) {
                            this.isGameVersionValid = isGameVersionValid
                        }

                        this.isBusy = false;
                    });
                } else {
                    this.isBusy = false;
                }
            }
        });
    }

    installGame() {
        this.isBusy = true;
        this.isGameLoading = true;
        this.valueProgressBar = 0;
        this.gameLoadingMessage = "Загрузка файлов игры...";

        this.downloadService.getGameFiles().subscribe(event => {
            if (event.type === HttpEventType.DownloadProgress) {
                this.valueProgressBar = this.compilePercent(event.loaded, event.total)
            } else if (event.type === HttpEventType.Response) {
                this.gameLoadingMessage = "Распаковка...";
                this.downloadService.saveGameFiles(event.body).then(value => {
                    if (value) {
                        this.valueProgressBar = 100
                        this.chekVersion()

                        this.isGameLoading = false;
                        this.isBusy = false;
                    }
                })
            }
        })
    }

    startGame() {
        this.downloadService.startGame(this.selectedCharacterName, this.selectedServerIp)
    }

    compilePercent(loaded: number, total: number): number {
        return (loaded / total) * 90
    }
}
