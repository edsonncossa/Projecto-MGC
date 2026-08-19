import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { SaleOfServicesComponent } from './sale-of-services/sale-of-services.component';
import { SalesOrderComponent } from './sales-order/sales-order.component';
import { SaleComponent } from './sale/sale.component';

const routes: Routes = [
  {
    path: '',
    component: SalesComponent,
    pathMatch: 'prefix',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sale'
      },
      {
        path: 'sale',
        component: SaleComponent
      },
      {
        path: 'orders',
        component: SalesOrderComponent
      },
      {
        path: 'services',
        component: SaleOfServicesComponent
      },
    ]

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
