import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '@app/services/product.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { StockService } from '@app/services/stock.service';
import { Product } from '@app/shared/models/product';
import { Stock } from '@app/shared/models/stock';

export interface DialogData {
  stock?: Stock;
}

@Component({
  selector: 'app-add-stock-dialog',
  templateUrl: './add-stock-dialog.component.html',
  styleUrls: ['./add-stock-dialog.component.scss']
})
export class AddStockDialogComponent implements OnInit {

  form: FormGroup;
  isLoading = false;
  loadingProducts = false;
  products: Product[] = [];

  //Getter para saber se é edição
  get isEditMode(): boolean {
    return !!this.data?.stock?.id;
  }

  //Getter para ID do estoque (se edição)
  get productId(): number | undefined {
    return this.data?.stock?.id;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddStockDialogComponent>,
    private stockService: StockService,
    private productService: ProductService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      id: [],
      productId: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {

    // Se for edição, preenche o formulário
    if (this.isEditMode && this.data?.stock) {
      this.loadProductsEdicao();
      this.patchForm(this.data.stock);
    }else
    {
      this.loadProducts();
    }
  }

  private loadProducts(): void {
    this.loadingProducts = true;

    this.productService.findProductsWithoutStock().subscribe({
      next: (resp) => {
        this.products = resp;
        this.loadingProducts = false;

        if (this.isEditMode && this.data?.stock) {
          this.patchForm(this.data.stock);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produtos', err);
        this.snackbar.error('Erro ao carregar produtos');
        this.products = [];
        this.loadingProducts = false;
      }
    });
  }

  loadProductsEdicao(): void {
    if (this.isEditMode && this.data?.stock) {
      this.productService.findAll(0, 100, '', 'asc').subscribe({
        next: (resp) => {
          console.log('Produtos carregados para edição:', resp);
          this.products = resp._embedded?.products ?? [];
          this.loadingProducts = false;

          if (this.isEditMode && this.data?.stock) {
            this.patchForm(this.data.stock);
          }
        },
        error: (err) => {
          console.error('Erro ao carregar produtos', err);
          this.snackbar.error('Erro ao carregar produtos');
          this.products = [];
        }
      });
    }
  }

  // Função para comparar objetos no mat-select
  compareProducts(c1: Product, c2: Product): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  private patchForm(stock: Stock): void {

    this.form.patchValue({
      id: stock.id,
      product: stock.product,
      productId: stock.productId,
      quantity: stock.quantity
    });

  }

  salvar(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;

      const formValue = this.form.getRawValue();

      // Monta payload: extrai categoryId do objeto Category selecionado
      const payload = {
        id: formValue.id,
        productId: formValue.productId,
        quantity: formValue.quantity,
      };

      const operation = this.isEditMode
        ? this.stockService.update({ ...payload, id: formValue.id })
        : this.stockService.create(payload);


      operation.subscribe({
        next: (stock: Stock) => {
          this.isLoading = false;
          this.dialogRef.close(stock);
          this.snackbar.success(`Estoque ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
          this.snackbar.error('Erro ao salvar estoque.');
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
      || `Erro ao ${this.isEditMode ? 'atualizar' : 'salvar'} cliente.`;
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
