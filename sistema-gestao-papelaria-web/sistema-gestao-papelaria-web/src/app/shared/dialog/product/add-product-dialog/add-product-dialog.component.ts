import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '@app/services/category.service';
import { ProductService } from '@app/services/product.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { Category, Product, Unit } from '@app/shared/models/product';
import imageCompression from 'browser-image-compression';



export interface DialogData {
  product?: Product;
  viewOnly?: boolean;
}

@Component({
  selector: 'app-add-product-dialog',
  templateUrl: './add-product-dialog.component.html',
  styleUrls: ['./add-product-dialog.component.scss']
})
export class AddProductDialogComponent implements OnInit {

  form: FormGroup;
  isLoading = false;
  loadingCategories = false;
  loadingUnits = false;
  categories: Category[] = [];
  units: Unit[] = [];

  selectedFile: File | null = null;
  imageBase64: string | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  //Getter para saber se é edição
  get isEditMode(): boolean {
    return !!this.data?.product?.id;
  }

  //Getter para ID do Produto (se edição)
  get productId(): number | undefined {
    return this.data?.product?.id;
  }

  get isViewMode(): boolean {
    return !!this.data?.viewOnly;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddProductDialogComponent>,
    private productService: ProductService,
    private categoryService: CategoryService,
    private snackbar: SnackbarService
    ,
    @Inject(MAT_DIALOG_DATA) public data: DialogData  // Dados injetados
  ) {

    this.form = this.fb.group({
      id: [],
      name: ['', Validators.required],
      description: [''],
      unitPrice: ['', Validators.required],
      categoryId: ['', Validators.required],
      category: [],
      image: []
    });
  }


  ngOnInit(): void {
    this.loadCategories();

    // Se for edição, preenche o formulário
    if (this.isEditMode && this.data?.product) {
      this.patchForm(this.data.product);
    }
  }

  private loadCategories(): void {
    this.loadingCategories = true;

    this.categoryService.findAll(0, 100, '', 'asc').subscribe({
      next: (categories) => {
        this.categories = categories._embedded?.categorys ?? [];
        this.loadingCategories = false;

        // Se estiver editando e a categoria já estiver carregada, atualiza a seleção
        if (this.isEditMode && this.data?.product?.category) {
          this.patchForm(this.data.product);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar categorias', err);
        this.snackbar.error('Erro ao carregar categorias');
        this.categories = [];
        this.loadingCategories = false;
      }
    });
  }

  // Função para comparar objetos no mat-select
  compareCategories(c1: Category, c2: Category): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  compareUnits(c1: Unit, c2: Unit): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  private patchForm(product: Product): void {

    this.form.patchValue({
      id: product.id,
      name: product.name,
      description: product.description,
      unitPrice: product.unitPrice,
      categoryId: product.categoryId,
      category: product.category,
      image: product.image
    });

    if (product.image) {
      this.imagePreview = product.image;
      this.imageBase64 = product.image;
    }
  }

  salvar(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;

      const formValue = this.form.getRawValue();

      // Monta payload: extrai categoryId do objeto Category selecionado
      const payload = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description,
        unitPrice: formValue.unitPrice,
        categoryId: formValue.categoryId,
        image: this.imageBase64 ?? undefined
      };
      const operation = this.isEditMode
        ? this.productService.update({ ...payload, id: formValue.id })
        : this.productService.create(payload);

      operation.subscribe({
        next: (product: Product) => {
          this.isLoading = false;
          this.dialogRef.close(product);
          this.snackbar.success(`Produto ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
          this.snackbar.error('Erro ao salvar produto.');
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

  onCategoryChange(event: any): void {
    setTimeout(() => {
      this.form.get('category')?.updateValueAndValidity();
    });
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    try {
      // Opções de compressão
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true
      };

      // comprime a imagem
      const compressedFile = await imageCompression(file, options);

      this.selectedFile = compressedFile;

      const reader = new FileReader();

      reader.onload = () => {
        this.imagePreview = reader.result;
        this.imageBase64 = reader.result as string;
      };

      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
    }
  }

}
