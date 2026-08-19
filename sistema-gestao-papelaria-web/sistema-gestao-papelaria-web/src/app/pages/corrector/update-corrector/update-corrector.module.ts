import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { updateCorrectorRoutingModule } from './update-corrector-routing.module';
import { updateCorrectorComponent } from './update-corrector.component';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    updateCorrectorComponent,
    updateCorrectorRoutingModule
  ]
})
export class updateCorrectorModule { }
