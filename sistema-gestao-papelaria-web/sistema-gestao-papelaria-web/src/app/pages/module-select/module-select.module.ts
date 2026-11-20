import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModuleSelectComponent } from './module-select.component';

@NgModule({
  declarations: [ModuleSelectComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: ModuleSelectComponent }])]
})
export class ModuleSelectModule {}