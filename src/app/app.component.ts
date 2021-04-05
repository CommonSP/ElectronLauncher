import {Component, OnInit} from '@angular/core';
import {ElectronService} from 'ngx-electron';
import {DownloadFilesService} from "./shared/services/download-files.service";
import {HttpEventType} from "@angular/common/http";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'xLauncher';
  valueProgressBar = 0
  validL = false
  validG = false
  errMessage = ''

  constructor(private electronService: ElectronService,
              private downloadService: DownloadFilesService) {
  }

  ngOnInit() {
    this.chekVersion()
  }

  chekVersion() {
    this.downloadService.checkLauncherVersion().subscribe(valid => {
      if (valid) {
        this.validL = valid
      } else {
        this.errMessage = 'Перейдите по адресу "Серый соси хуй" и скачайте новую версию лаунчера'
      }

    })
    this.downloadService.checkGameVersion().subscribe(valid => {
      if (valid) {
        this.validG = valid
      } else {
        this.errMessage = 'Установите игру'
      }
    })
  }

  startGame() {
    this.downloadService.startGame()
  }

  downloadGame() {
    this.updateGame()
  }

  updateGame() {
    this.downloadService.getGameFiles().subscribe(event => {
      if (event.type === HttpEventType.DownloadProgress) {
        this.valueProgressBar = this.compilePercent(event.loaded, event.total)
      } else if (event.type === HttpEventType.Response) {
        this.downloadService.saveGameFiles(event.body).then(value => {
          if (value) {
            this.valueProgressBar = 100
            this.chekVersion()
          }
        })
      }
    })
  }

  compilePercent(loaded: number, total: number): number {
    return (loaded / total) * 90
  }
}
