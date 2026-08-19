import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { SalesComponent } from './sales.component';
import { SalesMaterialModule } from '@app/shared/materials/sales-mat.module';
import { SharedModule } from '@app/shared/shared.module';
import { SalesOrderComponent } from './sales-order/sales-order.component';
import { SaleOfServicesComponent } from './sale-of-services/sale-of-services.component';
import { SaleComponent } from './sale/sale.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';


@NgModule({
  declarations: [
    SalesComponent,
    SalesOrderComponent,
    SaleOfServicesComponent,
    SaleComponent
  ],
  imports: [
    CommonModule,
    SalesMaterialModule,
    SalesRoutingModule,
    SharedModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule
  ]
})
export class SalesModule { }
