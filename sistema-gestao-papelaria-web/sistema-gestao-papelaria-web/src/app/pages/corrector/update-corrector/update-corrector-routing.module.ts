import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { updateCorrectorComponent } from './update-corrector.component';

const routes: Routes = [
  {
    path: '',
    component: updateCorrectorComponent,
    pathMatch: 'prefix'

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class updateCorrectorRoutingModule { }
