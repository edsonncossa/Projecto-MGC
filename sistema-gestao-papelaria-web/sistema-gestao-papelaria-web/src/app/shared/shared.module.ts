import { NgModule } from '@angular/core';
import { ToolbarTitleComponent } from './components/toolbar-title/toolbar-title.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { PhoneMaskDirective } from './mask/phone-mask.directive';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDialogComponent } from './dialog/confirm-dialog.component';
import { AddProductDialogComponent } from './dialog/product/add-product-dialog/add-product-dialog.component';
import { AddStockDialogComponent } from './dialog/stock/add-stock-dialog/add-stock-dialog.component';
import { StockStatusPipe } from './pipes/stock-status.pipe';
import { StockDialogComponent } from './dialog/stock/stock-dialog/stock-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MovementTypePipe } from './pipes/movement-type.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { AddStockMovementComponent } from './dialog/stock/add-stock-movement/add-stock-movement.component';
import { AddCategoryComponent } from './dialog/settings/add-category/add-category.component';
import { AddUnitComponent } from './dialog/settings/add-unit/add-unit.component';
import { AddClientDialogComponent } from './dialog/client/add-client-dialog/add-client-dialog.component';
import { AddProductUnitConversionComponent } from './dialog/settings/add-product-unit-conversion/add-product-unit-conversion.component';
import { AddCorrectorDialogComponent } from './dialog/corrector/add-corrector-dialog/add-corrector-dialog.component';
import { MatDividerModule } from '@angular/material/divider'; 



@NgModule({
  imports: [
    MatToolbarModule,
    MatIconModule,
    FlexLayoutModule,
    MatInputModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatTableModule,
    MatDatepickerModule,
    MatChipsModule,
    MatDividerModule,
  ],
  declarations: [
    ToolbarTitleComponent,
    AddClientDialogComponent,
    PhoneMaskDirective,
    ConfirmDialogComponent,
    AddProductDialogComponent,
    AddStockDialogComponent,
    StockStatusPipe,
    StockDialogComponent,
    MovementTypePipe,
    AddStockMovementComponent,
    AddStockMovementComponent,
    AddCategoryComponent,
    AddUnitComponent,
    AddProductUnitConversionComponent,
    AddCorrectorDialogComponent,

  ],
  exports: [
    ToolbarTitleComponent,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    StockStatusPipe
  ]
})
export class SharedModule { }
