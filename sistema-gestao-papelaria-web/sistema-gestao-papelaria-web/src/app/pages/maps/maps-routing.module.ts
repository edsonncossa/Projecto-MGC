import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapsComponent } from './maps.component';
import { GmapsComponent } from './gmaps/gmaps.component';

const routes: Routes = [{
  path: '',
  component: MapsComponent,
  children: [
    {
      path: '',
      redirectTo: 'gmaps',
      pathMatch: 'full',
    },
    {
      path: 'gmaps',
      component: GmapsComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MapsRoutingModule { }

export const routedComponents = [
  MapsComponent,
  GmapsComponent,
];