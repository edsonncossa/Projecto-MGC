import { Product } from './../../../shared/models/product';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ProductService } from '../../../services/product.service';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '@app/services/snackbar.service';
import { ConfirmDialogComponent } from '@app/shared/dialog/confirm-dialog.component';
import { AddProductDialogComponent } from '@app/shared/dialog/product/add-product-dialog/add-product-dialog.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements AfterViewInit, OnInit {

  displayedColumns: string[] = ['image', 'reference', 'name', 'unitPrice', 'category', 'action'];
  dataSource: Product[] = [];

  totalElements = 0;
  pageSize = 5;
  pageIndex = 0;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  previewImage: string | null = null;
  previewX = 0;
  previewY = 0;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private snackbar: SnackbarService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {

    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadProducts();
    });

    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadProducts();
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;

    this.loadProducts();
  }

  loadProducts(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || 'name';

    this.productService
      .findAll(
        this.pageIndex,
        this.pageSize,
        sortField,
        direction,
        this.filterValue
      )
      .subscribe({
        next: (resp) => {
          this.dataSource = resp._embedded?.products ?? [];
          this.totalElements = resp.page?.totalElements ?? 0;
        },
        error: (err) => {
          console.error('Erro ao carregar produtos:', err);
          this.dataSource = [];
          this.totalElements = 0;
          this.snackbar.error('Erro ao carregar produtos.');
        }
      });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddProductDialogComponent, { width: '600px', data: null });
    dialogRef.afterClosed().subscribe((result: Product | undefined) => {
      if (result) this.loadProducts();
    });
  }

  editarProduto(product: Product): void {
    const dialogRef = this.dialog.open(AddProductDialogComponent, { width: '600px', data: { product } });
    dialogRef.afterClosed().subscribe((result: Product | undefined) => {
      if (result) this.loadProducts();
    });
  }

  desativarProduto(product: Product): void {
    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desativar Produto',
        message: `Tem certeza que deseja desativar o Produto "${product.name}"?`,
        confirmText: 'Desativar',
        cancelText: 'Cancelar',
        color: 'warn',
        icon: 'fa-trash-can',
        iconColor: '#DC2626'
      }
    });

    confirmDialog.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && product.id) {
        this.productService.disableProduct(product.id).subscribe({
          next: () => {
            this.loadProducts();
            this.snackbar.success('Produto desativado com sucesso!');
          },
          error: () => {
            this.snackbar.error('Erro ao desativar Produto.');
          }
        });
      }
    });
  }

  getImage(image: string | undefined): string {
    if (!image) return 'assets/No_Image.svg.png';
    return image.startsWith('data:')
      ? image
      : 'data:image/jpeg;base64,' + image;
  }

  showPreview(event: MouseEvent, image: string | undefined) {
    if (!image) return;

    this.previewImage = image;
    this.previewX = event.clientX + 15;
    this.previewY = event.clientY + 15;
  }

  movePreview(event: MouseEvent) {
    this.previewX = event.clientX + 15;
    this.previewY = event.clientY + 15;
  }

  hidePreview() {
    this.previewImage = null;
  }

  visualizarProduto(product: Product): void {
  this.dialog.open(AddProductDialogComponent, {
    width: '600px',
    data: {
      product,
      viewOnly: true // 👈 aqui está a chave
    }
  });
}

}
