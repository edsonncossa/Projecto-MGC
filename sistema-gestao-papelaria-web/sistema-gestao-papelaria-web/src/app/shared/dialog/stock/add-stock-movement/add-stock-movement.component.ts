import { Stock } from './../../../models/stock';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovementType, StockMovement } from '@app/shared/models/stockMovement';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from '@app/shared/models/product';
import { ProductService } from '@app/services/product.service';
import { StockMovementService } from '@app/services/stockMovement.service';
import { SnackbarService } from '@app/services/snackbar.service';


export interface DialogData {
  stock?: Stock;
}

@Component({
  selector: 'app-add-stock-movement',
  templateUrl: './add-stock-movement.component.html',
  styleUrls: ['./add-stock-movement.component.scss']
})
export class AddStockMovementComponent implements OnInit {

  form: FormGroup;
  isLoading = false;
  loadingProducts = false;
  products: Product[] = [];
  stockSelecionado: Stock | null = null;
  stocks: Stock[] = [];

  //Getter para saber se é edição
  get isEditMode(): boolean {
    return !!this.data?.stock?.id;
  }

  //Getter para ID do estoque (se edição)
  get stockId(): number | undefined {
    return this.data?.stock?.id;
  }

  //Getter para o estoque selecionado
  get stock(): Stock | null {
    return this.data?.stock || null;
  }


  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddStockMovementComponent>,
    private productService: ProductService,
    private stockMovementService: StockMovementService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.form = this.fb.group({
      id: [],
      stockId: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    if (this.data?.stock) {
      this.stockSelecionado = this.data.stock;

      // coloca no form
      this.form.patchValue({
        stockId: this.data.stock.id
      });

      // BLOQUEIA o campo
      this.form.get('stockId')?.disable();

      this.stocks = [this.data.stock];
    }
  }

  // Função para comparar objetos no mat-select
  compareProducts(c1: Product, c2: Product): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  salvar(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;

      const formValue = this.form.getRawValue();

      // Monta payload: extrai categoryId do objeto Category selecionado
      const payload = {
        id: formValue.id,
        stockId: formValue.stockId,
        quantity: formValue.quantity,
        type: (MovementType.ENTRY)
      };

      const operation = this.stockMovementService.create(payload);

      operation.subscribe({
        next: (stockMovement: StockMovement) => {
          this.isLoading = false;
          this.dialogRef.close(stockMovement);
          this.snackbar.success(`Movimento de estoque ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
          this.snackbar.error('Erro ao salvar movimento de estoque.');
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  //Tratamento de erro centralizado
  private handleError(error: any): void {
    const msg = error.error?.message
      || error.error?.errors?.map((e: any) => e.message).join(', ')
      || `Erro ao ${this.isEditMode ? 'atualizar' : 'salvar'} movimento de estoque.`;
    alert(msg);
  }

  cancelar() {
    this.dialogRef.close();
  }

  onProductChange(event: any): void {
    setTimeout(() => {
      this.form.get('productId')?.updateValueAndValidity();
    });
  }

}
