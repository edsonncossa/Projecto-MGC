import { Component, OnInit } from '@angular/core';
import { ClientService } from '@app/services/client.service';
import { SaleService } from '@app/services/sale.service';
import { Client } from '@app/shared/models/client';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { CorrectorService } from '@app/services/corrector.service';

@Component({
  selector: 'app-update-corrector',
  templateUrl: './update-corrector.component.html',
  styleUrls: ['./update-corrector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    FormsModule
  ]
})
export class updateCorrectorComponent implements OnInit { // Nome corrigido para PascalCase

  updateForm!: FormGroup;
  listaClientes: Client[] = [];
  listaCorrectores: any[] = [];

  constructor(
    private clientService: ClientService, 
    private saleService: SaleService, 
    private formBuilder: FormBuilder, 
    private correctorService: CorrectorService
  ) { }

  ngOnInit(): void {
    // Carrega os dados necessários ao iniciar o ecrã
    this.carregarListaClientes();
    this.carregarListaCorrectores();

    // Inicialização do formulário reativo
    this.updateForm = this.formBuilder.group({
      clienteSelecionadoId: ['', Validators.required], // Sincronizado com o HTML
      correctorId: ['', Validators.required],
      colaboradorSubstituicao: ['', Validators.required],
      motivoAtualizacao: ['', Validators.required],
      fezDownload: [null, Validators.required], // Começa como nulo para forçar escolha
      motivoNaoDownload: [''] // Declarado aqui para evitar erros de "undefined"
    });

    // Subscrição inteligente para validação condicional do download
    this.updateForm.get('fezDownload')?.valueChanges.subscribe((fezDownload: boolean) => {
      const motivoControl = this.updateForm.get('motivoNaoDownload');
      
      if (fezDownload === false) {
        // Se NÃO fez download, o motivo passa a ser OBRIGATÓRIO
        motivoControl?.setValidators([Validators.required]);
      } else {
        // Se fez download (true), limpamos o valor e removemos a obrigatoriedade
        motivoControl?.clearValidators();
        motivoControl?.setValue('');
      }
      motivoControl?.updateValueAndValidity();
    });
  }

  carregarListaCorrectores(): void {
    // Carrega todos os corretores (sem paginação para o select)
    this.correctorService.findAll(0, 1000, 'name', 'asc', '').subscribe({
      next: (res) => {
        this.listaCorrectores = res._embedded?.correctors ?? [];
      },
      error: (err) => console.error('Erro ao carregar corretores:', err)
    });
  }


  carregarListaClientes(): void {
    // Carrega todos os clientes (sem paginação para o select)
    this.clientService.findAll(0, 1000, 'firstName', 'asc', '').subscribe({
      next: (res) => {
        this.listaClientes = res._embedded?.clients ?? [];
      },
      error: (err) => console.error('Erro ao carregar clientes:', err)
    });
  }

  onSubmit(): void {
    if (this.updateForm.valid) {
      console.log('Formulário submetido com sucesso:', this.updateForm.value);
      // Aqui pode chamar o serviço para enviar os dados salvos
    } else {
      // Força a validação visual dos campos caso o utilizador tente submeter com erros
      this.updateForm.markAllAsTouched();
    }
  }
}