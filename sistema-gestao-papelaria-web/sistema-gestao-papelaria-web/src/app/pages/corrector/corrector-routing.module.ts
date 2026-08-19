import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CorrectorComponent } from './corrector.component';
import { updateCorrectorComponent } from './update-corrector/update-corrector.component';
import { CorrectorListComponent } from './corrector-list/corrector-list.component';

const routes: Routes = [
  {
    path: '',
    component: CorrectorComponent,
    children: [
      { path: 'corrector-list', component: CorrectorListComponent },
      { path: 'update-corrector', component: updateCorrectorComponent }
    ]
  }
];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CorrectorRoutingModule { }
