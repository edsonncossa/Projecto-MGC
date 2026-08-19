import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProductUnitConversionService } from '@app/services/ProductUnitConversion.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { AddProductUnitConversionComponent } from '@app/shared/dialog/settings/add-product-unit-conversion/add-product-unit-conversion.component';
import { ProductUnitConversion } from '@app/shared/models/product';

@Component({
  selector: 'app-product-unit-conversion',
  templateUrl: './product-unit-conversion.component.html',
  styleUrls: ['./product-unit-conversion.component.scss']
})
export class ProductUnitConversionComponent implements AfterViewInit, OnInit {

  displayedColumns: string[] = ['productName', 'unitName', 'conversionFactor', 'action'];

  dataSource: ProductUnitConversion[] = [];

  totalElements = 0;
  pageSize = 5;
  pageIndex = 0;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productUnitConversionService: ProductUnitConversionService,
    private snackbar: SnackbarService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadingProductUnitConversions();
  }

  ngAfterViewInit(): void {

    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadingProductUnitConversions();
    });

    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadingProductUnitConversions();
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;

    this.loadingProductUnitConversions();
  }

  loadingProductUnitConversions(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || '';

    this.productUnitConversionService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    ).subscribe({
      next: (response) => {
        console.log("Response ", response);

        // CORREÇÃO: usar o nome correto do array retornado pelo backend
        this.dataSource = response._embedded?.productUnitConversion ?? [];
        this.totalElements = response.page?.totalElements ?? 0;
      },
      error: (err) => {
        console.error('Erro ao carregar conversões de unidade de produto:', err);
        this.dataSource = [];
        this.snackbar.error('Erro ao carregar conversões de unidade de produto');
      }
    });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddProductUnitConversionComponent, { width: '600px', data: null });
    dialogRef.afterClosed().subscribe((result: ProductUnitConversion | undefined) => {
      if (result) this.loadingProductUnitConversions();
    });
  }

  editarProdutoUnitConversion(productUnitConversion: ProductUnitConversion): void {
    const dialogRef = this.dialog.open(AddProductUnitConversionComponent, { width: '600px', data: { productUnitConversion } });
    dialogRef.afterClosed().subscribe((result: ProductUnitConversion | undefined) => {
      if (result) this.loadingProductUnitConversions();
    });
  }

}
