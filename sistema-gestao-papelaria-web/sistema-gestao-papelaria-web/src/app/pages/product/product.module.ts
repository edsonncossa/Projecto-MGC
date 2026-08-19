import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductRoutingModule } from './product-routing.module';
import { ProductComponent } from './product.component';
import { SharedModule } from '@app/shared/shared.module';
import { ProductMaterialModule } from '@app/shared/materials/product-mat.module';
import { ProductListComponent } from './product-list/product-list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MtzCurrencyPipe } from '@app/shared/mask/mtz-currency.pipe';


@NgModule({
  declarations: [
    ProductComponent,
    ProductListComponent,

  ],
  imports: [
    CommonModule,
    ProductRoutingModule,
    SharedModule,
    ProductMaterialModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MtzCurrencyPipe
  ]
})
export class ProductModule { }
