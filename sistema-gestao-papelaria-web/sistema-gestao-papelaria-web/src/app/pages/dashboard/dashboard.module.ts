import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SharedModule } from '@app/shared/shared.module';
import { DashboardMaterialModule } from '@app/shared/materials/dashboard-mat.module';
import { DashboardListComponent } from './dashboard-list/dashboard-list.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatTableModule } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';



@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatChipsModule,
    DashboardRoutingModule,
    SharedModule,
    DashboardMaterialModule,
    MatTooltipModule,
    NgxChartsModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatChipsModule,
    DashboardListComponent,
    MatDatepickerModule
  ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]


})
export class DashboardModule { }
