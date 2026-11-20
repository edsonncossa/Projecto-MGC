import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SimulacaoComponent } from './simulacao.component';

@NgModule({
  declarations: [SimulacaoComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: SimulacaoComponent }])
  ]
})
export class SimulacaoModule {}
