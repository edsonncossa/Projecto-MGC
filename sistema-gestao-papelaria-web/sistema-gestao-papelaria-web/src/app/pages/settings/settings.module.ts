import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { SharedModule } from '@app/shared/shared.module';
import { SettingsMaterialModule } from '@app/shared/materials/settings-mat.module';
import { CategoryComponent } from './category/category.component';
import { UnitComponent } from './unit/unit.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { ProductUnitConversionComponent } from './product-unit-conversion/product-unit-conversion.component';


@NgModule({
  declarations: [
    SettingsComponent,
    CategoryComponent,
    UnitComponent,
    ProductUnitConversionComponent,
  ],
  imports: [
    CommonModule,
    SettingsMaterialModule,
    SettingsRoutingModule,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule

  ]
})
export class SettingsModule { }
