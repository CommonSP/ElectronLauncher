import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { NgxElectronModule } from 'ngx-electron';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {HttpClientModule} from "@angular/common/http";
import {MatButtonModule} from '@angular/material/button'
import {MatIconModule} from '@angular/material/icon';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxElectronModule,
    MatProgressBarModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
