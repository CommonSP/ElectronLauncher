import {Component, OnInit} from '@angular/core';
import {ElectronService} from 'ngx-electron';
import {GameService, IServerInfo} from "./shared/services/game.service";
import {HttpEventType} from "@angular/common/http";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface ITrustedServerInfo extends IServerInfo {
    TrustedTrackerUrl: SafeUrl;
}

enum AppState {
    FirstInit,
    InvalidLauncherVersion,
    InvalidGameVersion,
    Installing,
    GameReady
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public state: AppState = AppState.FirstInit;
    public AppState = AppState;

    public isLauncherVersionValid = false
    public isGameInstalled = false;
    public isGameVersionValid = false

    public isBusy = false;
    public isGameLoading = false;
    public valueProgressBar = 32;
    public gameLoadingMessage = "";

    public hasError = false;
    public installingError: string = null;

    public serverList: ITrustedServerInfo[];

    public selectedServerIp: string;

    public isDataReceived = false;

    public isAdmin;

    public get canInstallGame() {
        return !this.isGameInstalled && !this.isBusy;
    }

    public get canUpdateGame() {
        return !this.isGameVersionValid && !this.isBusy;
    }

    public get canStartGame() {
        return this.isGameVersionValid && !this.isBusy;
    }

    constructor(private electronService: ElectronService,
        private gameService: GameService,
        private sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.gameService.checkAdminRights().then(isAdmin => {
            this.isAdmin = isAdmin;

            this.gameService.getLaucnherConfig().then(result => {
                this.serverList = [];
                result.ServerList.forEach(server => {
                    const trustedServer: ITrustedServerInfo = {
                        IpAddress: server.IpAddress,
                        Name: server.Name,
                        TrackerUrl: server.TrackerUrl,
                        TrustedTrackerUrl: this.sanitizer.bypassSecurityTrustResourceUrl(server.TrackerUrl)
                    };
    
                    this.serverList.push(trustedServer);
                });

                this.chekVersion()
            })
        });
    }

    closeApp() {
      this.electronService.ipcRenderer.send('close');
    }

    openExternal(url) {
      this.electronService.shell.openExternal(url);
    }

    chekVersion() {
        // this.gameLoadingMessage = "Загрузка файлов игры...";
        // this.state = AppState.Installing;

        // return;

        this.isLauncherVersionValid = this.gameService.launcherVersion === 'ValheimXv3';
        if (!this.isLauncherVersionValid) {
            this.state = AppState.InvalidLauncherVersion;
        } else {
            this.isGameInstalled = this.gameService.checkIsGameInstalled();
            if (!this.isGameInstalled) {
                this.state = AppState.InvalidGameVersion;
            } else {
                this.gameService.checkGameVersion().then(isGameVersionValid => {
                    this.isGameVersionValid = isGameVersionValid;

                    this.state =  this.isGameVersionValid ? AppState.GameReady : AppState.InvalidGameVersion;
                }, error => {
                    alert(error.message);
                });
            }
        }
    }

    installGame() {
        this.isBusy = true;
        this.isGameLoading = true;
        this.valueProgressBar = 0;
        this.gameLoadingMessage = "Загрузка файлов игры...";

        this.hasError = false;
        this.installingError = ''; 

        this.state = AppState.Installing;

        this.gameService.getGameFiles().subscribe(event => {
            if (event.type === HttpEventType.DownloadProgress) {
                this.valueProgressBar = this.compilePercent(event.loaded, event.total)
            } else if (event.type === HttpEventType.Response) {
                this.gameLoadingMessage = "Распаковка...";
                this.gameService.saveGameFiles(event.body).then(value => {
                    if (value) {
                        this.valueProgressBar = 100
                        this.chekVersion();

                        this.state = AppState.GameReady;

                        this.isGameLoading = false;
                        this.isBusy = false;
                    }
                }, error => {
                    this.onError(error);
                });
            }
        }, error => {
            this.onError(error);
        });
    }

    onError(error) {
        this.hasError = true;
        this.installingError = error.message; 
    }

    startGame() {
        this.gameService.startGame(this.selectedServerIp)
    }

    openGameFolder() {
        this.gameService.openGameFolder();
    }

    openLogFolder() {
        this.gameService.openLogFolder();
    }

    compilePercent(loaded: number, total: number): number {
        return (loaded / total) * 90
    }
}
