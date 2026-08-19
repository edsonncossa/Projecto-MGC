import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StockRoutingModule } from './stock-routing.module';
import { StockComponent } from './stock.component';
import { StockMaterialModule } from '@app/shared/materials/stock-mat.module';
import { SharedModule } from '@app/shared/shared.module';
import { StockListComponent } from './stock-list/stock-list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';


@NgModule({
  declarations: [
    StockComponent,
    StockListComponent
  ],
  imports: [
    CommonModule,
    StockRoutingModule,
    StockMaterialModule,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,

  ]
})
export class StockModule { }
