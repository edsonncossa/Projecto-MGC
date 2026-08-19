import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CorrectorListComponent } from './corrector-list.component';
import { correctorListRoutingModule } from './corrector-list-routing.module';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    CorrectorListComponent,
    correctorListRoutingModule
  ]
})
export class correctorListModule { }
