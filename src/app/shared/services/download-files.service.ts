import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent} from "@angular/common/http";
import {Observable} from "rxjs";
import {ElectronService} from "ngx-electron";
import {map} from "rxjs/operators";


const fs = (<any>window).require('fs')

@Injectable({
  providedIn: 'root'
})
export class DownloadFilesService {
  constructor(private http: HttpClient,
              private electronService: ElectronService) {
  }

  launcherVersion = 'ValheimXv1' || process.env.LAUNCHER_V

  urlGameDataPath = 'http://valheim.by/upload/Valheim.zip'
  urlLauncherVersionPath = 'http://valheim.by/upload/lversion.txt'
  urlGameVersionPath = 'http://valheim.by/upload/gversion.txt'

  getGameFiles(): Observable<HttpEvent<any>> {
    return this.http.get(this.urlGameDataPath, {responseType: "arraybuffer", reportProgress: true, observe: "events"})
  }

  saveGameFiles(data: any): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.writeFile(`game.zip`, new Buffer(data, 'binary'), (err) => {
        if (err) {
          reject()
        } else {
          this.electronService.ipcRenderer.invoke('unpacking').then((value) => {
            this.http.get(this.urlGameVersionPath, {responseType: "text"}).subscribe((data) => {
              fs.writeFileSync(`gameVersion.txt`, data)
              resolve(true)
            })

          }).catch(err => {
            reject()
          })
        }
      })

    })

  }

  checkLauncherVersion(): Observable<boolean> {
    return this.http.get(this.urlLauncherVersionPath, {responseType: "text"}).pipe(
      map((version) => {
        return version === this.launcherVersion
      })
    )
  }

  checkGameVersion(): Observable<boolean> {
    return this.http.get(this.urlGameVersionPath, {responseType: "text"}).pipe(
      map(version => {
        if (!fs.existsSync(`gameVersion.txt`)) {
          return false
        } else {
          let result = fs.readFileSync(`gameVersion.txt`, {encoding: 'utf8'}).trim()
          if (version === result) {
            return true
          }
        }
        return false
      })
    )
  }

  startGame() {
    this.electronService.ipcRenderer.send('startGame')
  }

}
