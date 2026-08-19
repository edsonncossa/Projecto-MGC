import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { CategoryComponent } from './category/category.component';
import { UnitComponent } from './unit/unit.component';
import { ProductUnitConversionComponent } from './product-unit-conversion/product-unit-conversion.component';

const routes: Routes = [
  {
  path: '',
  component: SettingsComponent,
  pathMatch: 'prefix',
  children: [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'category'
    },
    {
      path: 'category',
      component: CategoryComponent
    },
    {
      path: 'unit',
      component: UnitComponent,
    },
    {
      path: 'product-unit-conversion',
      component: ProductUnitConversionComponent
    }
  ]

}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
