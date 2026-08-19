import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Corrector, CorrectorExtensionLabel } from '@app/shared/models/corrector';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CorrectorService } from '@app/services/corrector.service';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '@app/services/snackbar.service';
import { AuthService } from '@app/services/auth.service';
import { User } from '@app/shared/models/user';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AddCorrectorDialogComponent } from '@app/shared/dialog/corrector/add-corrector-dialog/add-corrector-dialog.component';

@Component({
  selector: 'app-corrector-list',
  templateUrl: './corrector-list.component.html',
  styleUrls: ['./corrector-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class CorrectorListComponent implements OnInit, AfterViewInit {

  // As colunas declaradas aqui devem bater exatamente com o matColumnDef do HTML
  displayedColumns: string[] = [
    'name',
    'model',
    'serialNumber',
    'downloadExtension',
    'action' // Adicionado para permitir renderizar a coluna de botões
  ];

  dataSource: Corrector[] = [];
  totalElements = 0;
  pageSize = 5;
  pageIndex = 0;
  filterValue = '';
  user: User | null = null;

  CorrectorExtensionLabel = CorrectorExtensionLabel;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private correctorService: CorrectorService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCorrectors();
    this.user = this.auth.getUser();
    console.log('Usuário autenticado:', this.user?.fullName);
  }

  ngAfterViewInit(): void {
    // Escuta eventos de paginação
    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadCorrectors();
    });

    // Escuta eventos de ordenação
    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadCorrectors();
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;
    this.loadCorrectors();
  }

  loadCorrectors(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || 'name'; // Fallback para ordenar por nome

    this.correctorService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    ).subscribe({
      next: (response) => {
        this.dataSource = response._embedded?.correctors ?? [];
        this.totalElements = response.page?.totalElements ?? 0;
      },
      error: (err) => {
        console.error('Erro ao carregar corretores:', err);
        this.dataSource = [];
        this.totalElements = 0;
        this.snackbar.error('Erro ao carregar corretores!');
      }
    });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddCorrectorDialogComponent, {
      width: '600px',
      data: null 
    });

    dialogRef.afterClosed().subscribe((result: Corrector | undefined) => {
      if (result) {
        this.loadCorrectors();
      }
    });
  }

  editarCorrector(corrector: Corrector): void {
    console.log('Editar corretor:', corrector);
    // Adicione aqui a lógica de navegação ou abertura de diálogo para edição
    // Exemplo: this.router.navigate(['/corrector/update-corrector', corrector.id]);
  }

  desativarCorrector(corrector: Corrector): void {
    console.log('Desativar corretor:', corrector);
    // Adicione aqui a lógica para chamar o seu serviço de exclusão/desativação
  }
}