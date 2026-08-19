import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product, ProductUnitConversion, Unit } from '@app/shared/models/product';
import { ProductUnitConversionService } from '../../../../services/ProductUnitConversion.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { ProductService } from '@app/services/product.service';
import { unitService } from '@app/services/unit.service';

export interface DialogData {
  productUnitConversion?: ProductUnitConversion;
}
@Component({
  selector: 'app-add-product-unit-conversion',
  templateUrl: './add-product-unit-conversion.component.html',
  styleUrls: ['./add-product-unit-conversion.component.scss']
})
export class AddProductUnitConversionComponent implements OnInit {

  form: FormGroup;
  isLoading = false;
  loadingUnits = false;
  loadingProducts = false;
  products: Product[] = [];
  units: Unit[] = [];

  //Getter para saber se é edição
  get isEditMode(): boolean {
    return !!this.data?.productUnitConversion?.id;
  }

  get productId(): number | undefined {
    return this.data?.productUnitConversion?.productId;
  }

  constructor(
    private fb: FormBuilder,
    private productUnitConversionService: ProductUnitConversionService,
    private dialogRef: MatDialogRef<AddProductUnitConversionComponent>,
    private snackbar: SnackbarService,
    private productService: ProductService,
    private unitService: unitService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      id: [],
      productId: ['', Validators.required],
      unitId: ['', Validators.required],
      conversionFactor: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadUnits();
    // Se for edição, preenche o formulário
    if (this.isEditMode && this.data?.productUnitConversion) {
      this.patchForm(this.data.productUnitConversion);
    }
  }

  // Função para comparar objetos no mat-select
  compareProducts(c1: Product, c2: Product): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  compareUnits(c1: Unit, c2: Unit): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  private patchForm(productUnitConversion: ProductUnitConversion): void {
    this.form.patchValue({
      id: productUnitConversion.id,
      productId: productUnitConversion.productId,
      unitId: productUnitConversion.unitId,
      product: productUnitConversion.product,
      unit: productUnitConversion.unit,
      conversionFactor: productUnitConversion.conversionFactor
    });
  }

  salvar(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;
    }

    const formValue = this.form.getRawValue();

    const payload = {
      id: formValue.id,
      productId: formValue.productId,
      unitId: formValue.unitId,
      conversionFactor: formValue.conversionFactor
    };

    const opration = this.isEditMode
      ? this.productUnitConversionService.update(payload)
      : this.productUnitConversionService.create(payload);

    opration.subscribe({
      next: (response) => {
        this.snackbar.success(`Conversão de unidade de produto ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
        this.dialogRef.close(true); // Passa true para indicar que houve uma alteração
      },
      error: (err) => {
        console.error('Erro ao salvar conversão de unidade de produto:', err);
        this.snackbar.error('Ocorreu um erro ao salvar a conversão de unidade de produto. Por favor, tente novamente.');
        this.isLoading = false;
      }
    });
  }

  loadProducts(): void {
    const direction = 'asc';
    const sortField = 'name';

    this.productService.findAll(0, 100, sortField, direction).subscribe({
      next: (products) => {
        this.products = products._embedded.products;
        this.loadingProducts = false;

         // Se estiver editando e a categoria já estiver carregada, atualiza a seleção
        if (this.isEditMode && this.data?.productUnitConversion?.conversionFactor) {
          this.patchForm(this.data.productUnitConversion);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produtos', err);
        this.products = [];
        this.loadingProducts = false;
      }
    });
  }

  private loadUnits(): void {
    //this.loadingUnits = true;

    this.unitService.findAll(0, 100, '', 'asc').subscribe({
      next: (unit) => {
        this.units = unit._embedded.Unit;
        this.loadingUnits = false;

        console.log("Unitdsadsadsadasdad ", unit._embedded.unit)

        // Se estiver editando e a categoria já estiver carregada, atualiza a seleção
        if (this.isEditMode && this.data?.productUnitConversion) {
          this.patchForm(this.data.productUnitConversion);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar categorias', err);
        this.units = [];
        this.loadingUnits = false;
      }
    });
  }


  cancelar() {
    this.dialogRef.close();
  }
}
