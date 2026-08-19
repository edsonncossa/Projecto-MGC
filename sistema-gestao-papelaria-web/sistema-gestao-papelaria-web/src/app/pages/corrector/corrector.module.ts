import { SharedModule } from '@app/shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrectorRoutingModule } from './corrector-routing.module';
import { CorrectorComponent } from './corrector.component';
import { CorrectorMaterialModule } from '@app/shared/materials/corrector-mat.module';
import { CorrectorListComponent } from './corrector-list/corrector-list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';



@NgModule({
  declarations: [
    CorrectorComponent,

  ],
  imports: [
    CommonModule,
    CorrectorRoutingModule,
    CorrectorMaterialModule,
    CorrectorListComponent,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule
  ]
})
export class CorrectorModule { }
