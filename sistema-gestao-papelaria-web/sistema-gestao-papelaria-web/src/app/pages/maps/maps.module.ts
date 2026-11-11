import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NbCardModule } from '@nebular/theme';

import { MapsRoutingModule, routedComponents } from './maps-routing.module';

@NgModule({
  imports: [CommonModule, LeafletModule, MapsRoutingModule, NbCardModule],
  declarations: [...routedComponents],
})
export class MapsModule { }