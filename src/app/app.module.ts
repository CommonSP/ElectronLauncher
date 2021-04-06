import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { NgxElectronModule } from 'ngx-electron';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {HttpClientModule} from "@angular/common/http";
import {MatButtonModule} from '@angular/material/button'
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatMenuModule} from '@angular/material/menu';


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
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
