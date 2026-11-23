import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QualidadeComponent } from './qualidade.component';

@NgModule({
  declarations: [QualidadeComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: QualidadeComponent }])
  ]
})
export class QualidadeModule {}
