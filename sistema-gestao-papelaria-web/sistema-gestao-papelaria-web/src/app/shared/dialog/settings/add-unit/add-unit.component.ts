import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SnackbarService } from '@app/services/snackbar.service';
import { unitService } from '@app/services/unit.service';
import { Unit } from '@app/shared/models/product';



export interface DialogData {
  unit?: Unit;
}
@Component({
  selector: 'app-add-unit',
  templateUrl: './add-unit.component.html',
  styleUrls: ['./add-unit.component.scss']
})
export class AddUnitComponent implements OnInit {

  form: FormGroup;
  isLoading = false;

  //Getter para saber se é edição
  get isEditMode(): boolean {
    return !!this.data?.unit?.id;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddUnitComponent>,
    private unitService: unitService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      id: [],
      name: ['', Validators.required],
      symbol: ['', Validators.required],
      description: ['', Validators.required],

    });
  }

  ngOnInit(): void {
    // Se for edição, preenche o formulário
    if (this.isEditMode && this.data?.unit) {
      this.patchForm(this.data.unit);
    }
  }

  private patchForm(unit: Unit): void {
    this.form.patchValue({
      id: unit.id,
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description
    });
  }

  salvar(): void {
      if (this.form.valid && !this.isLoading) {
        this.isLoading = true;

        const formValue = this.form.getRawValue();

        const payload = {
          id: formValue.id,
          name: formValue.name,
          symbol: formValue.symbol,
          description: formValue.description
        }

        const operation = this.isEditMode
          ? this.unitService.update({ ...payload, id: formValue.id })
          : this.unitService.create(payload);

        operation.subscribe({
          next: (unit: Unit) => {
            this.isLoading = false;
            this.dialogRef.close(unit);
            this.snackbar.success(`Unidade ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
          },
          error: (error) => {
            this.isLoading = false;
            this.handleError(error);
            this.snackbar.error('Erro ao salvar unidade.');
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
      || `Erro ao ${this.isEditMode ? 'atualizar' : 'salvar'} cliente.`;
    alert(msg);
  }

  cancelar() {
    this.dialogRef.close();
  }

}
