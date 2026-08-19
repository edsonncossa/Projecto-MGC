import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { Client, ClientType, ClientTypeLabel } from '../../../shared/models/client';
import { ClientService } from '@app/services/client.service';
import { ConfirmDialogComponent } from '@app/shared/dialog/confirm-dialog.component';
import { SnackbarService } from '@app/services/snackbar.service';
import { AddClientDialogComponent } from '@app/shared/dialog/client/add-client-dialog/add-client-dialog.component';
import { AuthService } from '@app/services/auth.service';
import { User } from '@app/shared/models/user';

import { 
  NbCardModule, 
  NbIconModule, 
  NbButtonModule, 
  NbInputModule 
} from '@nebular/theme';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    // Módulos Nebular necessários para o HTML
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule
  ]
})
export class ClientListComponent implements AfterViewInit, OnInit {

  displayedColumns: string[] = [
    'firstName',
    'email',
    'phoneNumber',
    'address',
    'type',
    'corrector',
    'action'
  ];

  dataSource: Client[] = [];
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  filterValue = '';

  clientTypeLabel = ClientTypeLabel;
  user: User | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clientService: ClientService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.user = this.auth.getUser();
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadClients();
    });

    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.pageIndex = 0;
        this.loadClients();
      });
    }
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;
    this.loadClients();
  }

  loadClients(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || 'firstName';

    this.clientService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    ).subscribe({
      next: (response) => {
        this.dataSource = response._embedded?.clients ?? response.content ?? [];
        this.totalElements = response.page?.totalElements ?? response.totalElements ?? 0;
      },
      error: (err) => {
        console.error('Erro ao carregar clientes:', err);
        this.dataSource = [];
        this.totalElements = 0;
        this.snackbar.error('Erro ao carregar clientes!');
      }
    });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: Client | undefined) => {
      if (result) {
        this.loadClients();
      }
    });
  }

  editarCliente(client: Client): void {
    const dialogRef = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      data: { client }
    });

    dialogRef.afterClosed().subscribe((result: Client | undefined) => {
      if (result) {
        this.loadClients();
      }
    });
  }

  desativarCliente(client: Client): void {
    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desativar Cliente',
        message: `Tem certeza que deseja desativar o cliente "${client.firstName}"?`,
        confirmText: 'Desativar',
        cancelText: 'Cancelar',
        color: 'warn',
        icon: 'fa-trash-can',
        iconColor: '#DC2626'
      }
    });

    confirmDialog.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && client.id) {
        this.clientService.disableClient(client.id).subscribe({
          next: () => {
            this.loadClients();
            this.snackbar.success('Cliente desativado com sucesso!');
          },
          error: () => {
            this.snackbar.error('Erro ao desativar cliente.');
          }
        });
      }
    });
  }

  getClientTypeLabel(type: ClientType): string {
    switch (type) {
      case ClientType.COMPANY:
        return 'Empresa';
      default:
        return type || 'Padrão';
    }
  }
}