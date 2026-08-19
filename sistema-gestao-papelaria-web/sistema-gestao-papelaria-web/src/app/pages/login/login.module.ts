import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { SharedModule } from '@app/shared/shared.module';
import { LoginMaterialModule } from '@app/shared/materials/login-mat.module';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';


@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    LoginRoutingModule,
    LoginMaterialModule,
    SharedModule,
    MatCardModule,
    MatFormFieldModule,
    MatTooltipModule
  ]
})
export class LoginModule { }
