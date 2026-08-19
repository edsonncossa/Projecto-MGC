import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SnackbarService } from '@app/services/snackbar.service';
import { StockService } from '@app/services/stock.service';
import { AddStockDialogComponent } from '@app/shared/dialog/stock/add-stock-dialog/add-stock-dialog.component';
import { ConfirmDialogComponent } from '@app/shared/dialog/confirm-dialog.component';
import { Stock } from '@app/shared/models/stock';
import { StockDialogComponent } from '@app/shared/dialog/stock/stock-dialog/stock-dialog.component';

@Component({
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss']
})
export class StockListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'product',
    'quantity',
    'action'
  ];

  dataSource: Stock[] = [];

  totalElements = 0;
  pageSize = 5;
  pageIndex = 0;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
  ) { }

  ngOnInit(): void {
    this.loadStocks();
  }

  ngAfterViewInit(): void {

    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadStocks();
    });

    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadStocks();
    });
  }


  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;

    this.loadStocks();
  }

  loadStocks(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || '';

    this.stockService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    )
      .subscribe({
        next: (response) => {

        this.dataSource = response._embedded?.stock ?? [];
        this.totalElements = response.page?.totalElements ?? 0;
        },
        error: (err) => {
          console.error('Erro ao carregar stocks:', err);
          this.snackbar.error('Erro ao carregar stocks. Tente novamente.');

          this.dataSource = [];
          this.totalElements = 0;
        }
      });
  }

  //Método para CRIAR
  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddStockDialogComponent, {
      width: '600px',
      data: null  //
    });

    dialogRef.afterClosed().subscribe((result: Stock | undefined) => {
      if (result) {
        this.loadStocks();
      }
    });
  }

  editarStock(stock: Stock): void {
    console.log("Stock para editar: ", stock);
    const dialogRef = this.dialog.open(AddStockDialogComponent, {
      width: '600px',
      data: { stock }
    });

    dialogRef.afterClosed().subscribe((result: Stock | undefined) => {
      if (result) {
        this.loadStocks();
      }
    });
  }

  desativarStock(stock: Stock): void {
    // Confirmar ação com o usuário
    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desativar Produto',
        message: `Tem certeza que deseja desativar o Estoque "${stock.product?.name} "?`,
        confirmText: 'Desativar',
        cancelText: 'Cancelar',
        color: 'warn',
        icon: 'fa-trash-can',
        iconColor: '#DC2626'
      }
    });

    confirmDialog.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && stock.id) {
        this.stockService.disableStock(stock.id).subscribe({
          next: () => {
            this.loadStocks(); // Recarregar tabela
            this.snackbar.success('Produto desativado com sucesso!');
          },
          error: (error) => {
            this.snackbar.error('Erro ao desativar Produto.')
          }
        });
      }
    });
  }


  abrirContadoresDialog(stock: Stock): void {
    this.dialog.open(StockDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      panelClass: 'stock-counters-dialog',
      data: { stock }
    });
  }

}
