import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClientService } from '@app/services/client.service';
import { CorrectorService } from '@app/services/corrector.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { Client, ClientType } from '@app/shared/models/client';


export interface DialogData {
  client?: Client;
}

@Component({
  selector: 'app-add-client-dialog',
  templateUrl: './add-client-dialog.component.html',
  styleUrls: ['./add-client-dialog.component.scss']
})
export class AddClientDialogComponent implements OnInit {

  form: FormGroup;
  ClientType = ClientType;
  isLoading = false;

  get isEditMode(): boolean {
    return !!this.data?.client?.id;
  }

  //Getter para ID do cliente (se edição)
  get clientId(): number | undefined {
    return this.data?.client?.id;
  }

  tipos = [
    { value: ClientType.COMPANY, viewValue: 'Empresa' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddClientDialogComponent>,
    private clientService: ClientService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData  // Dados injetados
  ) {

    this.form = this.fb.group({
      id: [],
      firstName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      type: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Se for edição, preenche o formulário
    if (this.isEditMode && this.data?.client) {
      this.patchForm(this.data.client);
    

};



  }


  //Preenche formulário com dados do cliente (responsabilidade única)
  private patchForm(client: Client): void {

    this.form.patchValue({
      id: client.id,
      firstName: client.firstName,
      email: client.email,
      phoneNumber: this.formatPhoneForDisplay(client.phoneNumber),
      address: client.address,
      type: client.type
    });

  }

  //Formata telefone para exibição (849353568 → "84 935 3568")
  private formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3');
  }

salvar(): void {
  if (this.form.valid && !this.isLoading) {
    this.isLoading = true;

    const rawValue = this.form.value;

    const formValue = {
      id: rawValue.id,
      firstName: rawValue.firstName,
      email: rawValue.email,
      phoneNumber: rawValue.phoneNumber?.replace(/\D/g, ''),
      address: rawValue.address,
      type: rawValue.type
    };

    const clientPayload = formValue as unknown as Client;

    const operation = this.isEditMode
      ? this.clientService.update(clientPayload)
      : this.clientService.create(clientPayload);

    operation.subscribe({
      next: (client: Client) => {
        this.isLoading = false;
        this.dialogRef.close(client);
        this.snackbar.success(`Cliente ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
        this.snackbar.error('Erro ao salvar cliente.');
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

  getFormControl(name: string) {
    return this.form.get(name);
  }


compararCorretores(c1: any, c2: any): boolean {
  return c1 && c2 ? c1.id === c2.id : c1 === c2;
}

}
