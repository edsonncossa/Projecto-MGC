import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CorrectorListComponent } from './corrector-list.component';


const routes: Routes = [
  {
    path: '',
    component: CorrectorListComponent,
    pathMatch: 'prefix'

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class correctorListRoutingModule { }
