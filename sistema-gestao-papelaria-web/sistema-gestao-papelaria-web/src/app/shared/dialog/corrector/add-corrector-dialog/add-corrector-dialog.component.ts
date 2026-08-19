import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { CorrectorService } from '@app/services/corrector.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { Corrector, CorrectorExtension } from '@app/shared/models/corrector';

export interface DialogData {
  corrector?: Corrector;
}

@Component({
  selector: 'app-add-corrector-dialog',
  templateUrl: './add-corrector-dialog.component.html',
  styleUrls: ['./add-corrector-dialog.component.scss'],

  
})
export class AddCorrectorDialogComponent implements OnInit {

  form!: FormGroup;
  isLoading = false;
  
  // Mapeia os valores do enum CorrectorExtension para popular o select
  extensions = Object.values(CorrectorExtension);

  // Getter inteligente para detetar se o objeto recebido é para edição ou criação
  get isEditMode(): boolean {
    return !!this.data?.corrector?.id;
  }

  // Getter para ID do corretor (se edição)
  get correctorId(): number | undefined {
    return this.data?.corrector?.id;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCorrectorDialogComponent>,
    private correctorService: CorrectorService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { 

        this.form = this.fb.group({
      id: [],
      name: ['', Validators.required],
      model: ['', Validators.required],
      serialNumber: ['', Validators.required],
      downloadExtension: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Inicialização do formulário reativo com validações básicas


    // Se estiver em modo de edição e possuir dados do corretor, preenche o formulário
    if (this.isEditMode && this.data?.corrector) {
      this.patchForm(this.data.corrector);
    }
  }

  private patchForm(corrector: Corrector): void {
    this.form.patchValue({
      id: corrector.id,
      name: corrector.name,
      model: corrector.model,
      serialNumber: corrector.serialNumber,
      downloadExtension: corrector.downloadExtension
    });
  }

  salvar(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;

    
      const formValue = { ...this.form.value };

        if (!this.isEditMode) {
        delete formValue.id;
      }
      const operation = this.isEditMode
        ? this.correctorService.update(formValue)
        : this.correctorService.create(formValue);

      operation.subscribe({
        next: (savedCorrector: Corrector) => {
          this.isLoading = false;
          // Retorna "true" para o componente pai para acionar o recarregamento automático da lista
          this.dialogRef.close(true);
          this.snackbar.success(`Corretor ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
              this.snackbar.error('Erro ao salvar corretor.');
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  private handleError(error: any): void {
    const msg = error.error?.message
      || error.error?.errors?.map((e: any) => e.message).join(', ')
      || `Erro ao ${this.isEditMode ? 'atualizar' : 'salvar'} o corretor.`;
    this.snackbar.error(msg);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

    getFormControl(name: string) {
    return this.form.get(name);
  }
}