import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CategoryService } from '@app/services/category.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { AddCategoryComponent } from '@app/shared/dialog/settings/add-category/add-category.component';
import { Category } from '../../../shared/models/product';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements AfterViewInit, OnInit {

  displayedColumns: string[] = ['name', 'description', 'action'];

  dataSource: Category[] = [];

  totalElements = 0;
  pageSize = 5;
  pageIndex = 0;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private categoryService: CategoryService,
    private snackbar: SnackbarService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {

    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadCategories();
    });

    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadCategories();
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;

    this.loadCategories();
  }

  loadCategories(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || 'name';
    this.categoryService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    ).subscribe({
      next: (response) => {
        this.dataSource = response._embedded?.categorys ?? [];
        this.totalElements = response.page?.totalElements ?? 0; // Ajuste para total de elementos
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.snackbar.error('Erro ao carregar categorias');
      }
    });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddCategoryComponent, { width: '600px', data: null });
    dialogRef.afterClosed().subscribe((result: Category | undefined) => {
      if (result) this.loadCategories();
    });
  }

  editarCategoria(category: Category): void {
    const dialogRef = this.dialog.open(AddCategoryComponent, { width: '600px', data: { category } });
    dialogRef.afterClosed().subscribe((result: Category | undefined) => {
      if (result) this.loadCategories();
    });
  }

}
