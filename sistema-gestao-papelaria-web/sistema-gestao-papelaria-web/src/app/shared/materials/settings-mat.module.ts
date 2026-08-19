import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  exports: [
    MatIconModule,
    MatButtonModule,
    MatTabsModule
  ],
  declarations: [],
  providers: []
})
export class SettingsMaterialModule { }
