import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StockService } from '@app/services/stock.service';
import { StockMovementService } from '@app/services/stockMovement.service';
import { Stock } from '@app/shared/models/stock';
import { MovementType, StockMovement } from '@app/shared/models/stockMovement';
import { AddStockMovementComponent } from '../add-stock-movement/add-stock-movement.component';
import { SnackbarService } from '@app/services/snackbar.service';


export interface StockCounters {
  totalLancamentos: number;
  totalEntradas: number;
  totalSaidas: number;
  estoqueAtual: number;
}

export interface DialogData {
  stock?: Stock;
}


@Component({
  selector: 'app-stock-dialog',
  templateUrl: './stock-dialog.component.html',
  styleUrls: ['./stock-dialog.component.scss']
})
export class StockDialogComponent implements OnInit, AfterViewInit {

  counters: StockCounters = {
    totalLancamentos: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    estoqueAtual: 0
  };

  // isLoading = true;
  stockSelecionado: Stock | null = null;
  tituloDialog: string = 'Contadores do estoque';

  displayedColumns: string[] = ['product', 'quantity', 'type', 'createdAt'];
  dataSource = new MatTableDataSource<StockMovement>([]);

  // Paginação
  totalElements = 0;
  pageSize = 12;
  pageIndex = 0;

  // Ordenação
  sortProperty = 'product.name';
  sortDirection: 'asc' | 'desc' = 'asc';

  movements: StockMovement[] = [];
  loading = false;

  movimentNumber = 0;

  // Labels amigáveis
  movementTypeLabels: { [key in MovementType]: string } = {
    [MovementType.ENTRY]: 'Entrada',
    [MovementType.EXIT]: 'Saída'
  };


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public dialogRef: MatDialogRef<StockDialogComponent>,
    private stockService: StockService,
    private stockMovementService: StockMovementService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {

    setTimeout(() => {
      this.loading = true;
    });
    if (this.data?.stock) {
      this.stockSelecionado = this.data.stock;
      this.tituloDialog = `Contadores - ${this.stockSelecionado.product?.name || 'Estoque'}`;
    }

    this.loadCounters();
    this.loadMovements();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCounters(): void {
    //this.isLoading = true;
    // Se não tiver stock, busca todos para mostrar totais gerais
    this.stockService.findAll(0, 1000,'', 'asc').subscribe({
      next: (resp) => {
        const stocks: Stock[] = resp._embedded?.Stock ?? [];

        //this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar contadores', error);
        this.snackbar.error('Erro ao carregar contadores');
        //this.isLoading = false;
      }
    });
  }

  loadStocks(): void {

    this.stockService.findByProductId(this.stockSelecionado?.productId ?? 0).subscribe({
      next: (stock) => {
        this.stockSelecionado = stock;
        this.loadCounters();
        this.counters.estoqueAtual = stock.quantity;
      },
      error: (error) => {
        console.error('Erro ao carregar estoque', error);
        this.snackbar.error('Erro ao carregar estoque');
      }
    });
  }
  loadMovements(): void {
    this.loading = true;

    if (this.stockSelecionado?.product?.id !== undefined) {
      this.stockMovementService
        .findByProductIdAndStatus(this.stockSelecionado?.product?.id, 0, 12, 'createdDate', 'desc')
        .subscribe({
          next: (data) => {
            this.movements = data;
            this.dataSource.data = data;
            this.loading = false;
            this.updateCounters();
          },
          error: (err) => {
            console.error('Erro ao carregar movimentos', err);
            this.snackbar.error('Erro ao carregar movimentos');
            this.loading = false;
          }
        });
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  onSortChange(sort: Sort): void {
    this.sortProperty = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0; // Reseta para a primeira página ao ordenar
    this.loadMovements();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMovements();
  }

  onEdit(movement: StockMovement): void {
    console.log('Editar:', movement);
  }

  onDelete(movement: StockMovement): void {
    if (confirm(`Confirmar exclusão da movimentação de ${movement.stock?.product?.name}?`)) {
      // this.stockService.delete(movement.id).subscribe(...)
      console.log('Excluir:', movement);
    }
  }

  updateCounters(): void {

    const totalEntradas = this.movements
      .filter(m => m.type === MovementType.ENTRY)
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalSaidas = this.movements
      .filter(m => m.type === MovementType.EXIT)
      .reduce((sum, m) => sum + m.quantity, 0);

    this.counters.totalEntradas = totalEntradas;
    this.counters.totalSaidas = totalSaidas;

    this.counters.totalLancamentos = this.movements.length;

    this.counters.estoqueAtual = this.stockSelecionado?.quantity ?? 0;

    console.log()
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  //Método para CRIAR
  abrirDialog(stock: Stock | null): void {
    if (!stock) {
      console.error('Stock não selecionado');
      return;
    }

    const dialogRef = this.dialog.open(AddStockMovementComponent, {
      width: '600px',
      data: { stock }
    });

    dialogRef.afterClosed().subscribe((result: StockMovement | undefined) => {
      if (result) {
        this.loadMovements();
        this.updateCounters();
        this.loadCounters();
        this.loadStocks();
      }
    });
  }

  getMovementLabel(movement: StockMovement): string {
    return this.movementTypeLabels[movement.type];
  }
}
