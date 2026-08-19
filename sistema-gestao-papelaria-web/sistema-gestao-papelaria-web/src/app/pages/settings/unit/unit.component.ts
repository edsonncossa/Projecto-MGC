import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SnackbarService } from '@app/services/snackbar.service';
import { unitService } from '@app/services/unit.service';
import { AddUnitComponent } from '@app/shared/dialog/settings/add-unit/add-unit.component';
import { Unit } from '@app/shared/models/product';

export interface DialogData {
  unit?: Unit;
}

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss']
})
export class UnitComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'symbol', 'description', 'action'];

  dataSource: Unit[]=[];

  totalElements = 0;
  pageSize = 5;
  pageIndex = 0;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private unitService: unitService,
    private snackbar: SnackbarService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadUnits();
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadUnits();
    });

    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadUnits();
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.filterValue = value.trim().toLowerCase();
    this.pageIndex = 0;

    this.loadUnits();
  }

  loadUnits(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || '';

    this.unitService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    ).subscribe({
      next: (response) => {
        console.log("Response ", response);
        this.dataSource = response._embedded?.Unit ?? [];
        this.totalElements = response.page?.totalElements ?? 0;
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.snackbar.error('Erro ao carregar categorias');
      }
    });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddUnitComponent, { width: '600px', data: null });
    dialogRef.afterClosed().subscribe((result: Unit | undefined) => {
      if (result) this.loadUnits();
    });
  }

  editarUnit(unit: Unit): void {
    const dialogRef = this.dialog.open(AddUnitComponent, { width: '600px', data: { unit } });
    dialogRef.afterClosed().subscribe((result: Unit | undefined) => {
      if (result) this.loadUnits();
    });
  }

}
