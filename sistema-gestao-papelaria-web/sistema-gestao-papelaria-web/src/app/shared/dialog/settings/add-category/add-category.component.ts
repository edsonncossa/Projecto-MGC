import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '@app/services/category.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { Category } from '@app/shared/models/product';

export interface DialogData {
  category?: Category;
}

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {

  form: FormGroup;
  isLoading = false;

  //Getter para saber se é edição
  get isEditMode(): boolean {
    return !!this.data?.category?.id;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCategoryComponent>,
    private categoryService: CategoryService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      id: [],
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {

    // Se for edição, preenche o formulário
    if (this.isEditMode && this.data?.category) {
      this.patchForm(this.data.category);
    }
  }

  private patchForm(category: Category): void {
    this.form.patchValue({
      id: category.id,
      name: category.name,
      description: category.description
    });
  }

  salvar(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;

      const formValue = this.form.getRawValue();

      const payload = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description
      }

      const operation = this.isEditMode
        ? this.categoryService.update({ ...payload, id: formValue.id })
        : this.categoryService.create(payload);

      operation.subscribe({
        next: (response) => {
          this.snackbar.success(`Categoria ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
          this.dialogRef.close(true); // Fecha o diálogo e indica sucesso
        },
        error: (err) => {
          this.isLoading = false;
          const msg = err.error?.message
            || err.error?.errors?.map((e: any) => e.message).join(', ')
            || `Erro ao ${this.isEditMode ? 'atualizar' : 'salvar'} categoria.`;
          this.snackbar.error(msg);
        }
      });
    }
    else {
      this.form.markAllAsTouched();
    }
  }

  //Tratamento de erro centralizado
  private handleError(error: any): void {
    const msg = error.error?.message
      || error.error?.errors?.map((e: any) => e.message).join(', ')
      || `Erro ao ${this.isEditMode ? 'atualizar' : 'salvar'} categoria.`;
    this.snackbar.error(msg);
  }

  cancelar() {
    this.dialogRef.close();
  }

}
