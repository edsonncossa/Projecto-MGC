import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';;
import { MatTableDataSource } from '@angular/material/table';
import { ClientService } from '@app/services/client.service';
import { ProductService } from '@app/services/product.service';
import { ProductUnitConversionService } from '@app/services/ProductUnitConversion.service';
import { SaleService } from '@app/services/sale.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { StockService } from '@app/services/stock.service';
import { Client } from '@app/shared/models/client';
import { Product, ProductUnitConversion, Unit } from '@app/shared/models/product';
import { Sale, SaleItem, SaleRequest, SaleStatus } from '@app/shared/models/sale';
import { error } from 'console';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.scss']
})
export class SaleComponent implements OnInit {

  displayedColumns: string[] = [
    'image',
    'productName',
    'unitaryValue',
    'unitName',
    'quantity',
    'totalValue',
    'action'
  ];

  dataSource = new MatTableDataSource<SaleItem>();
  saleItems: SaleItem[] = [];

  saleCouter: string = 'Venda 1';
  valueSale: number = 0;

  products: Product[] = [];
  filteredProducts: Product[] = [];

  clients: Client[] = [];
  filteredClients: Client[] = [];

  selectedClient: Client | null = null;

  sale: Sale = {} as Sale;
  saleRequest = {} as SaleRequest;

  productUnitConversions: ProductUnitConversion[] = [];

  form: FormGroup;


  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private clientService: ClientService,
    private productUnitConversionService: ProductUnitConversionService,
    private snackbar: SnackbarService,
    private saleService: SaleService,
    private stockService: StockService
  ) {
    this.form = this.fb.group({
      productId: [null,],
      unitId: [null,],
      quantity: [null,],
      clientId: [null,]
    });
  }

  ngOnInit(): void {

    this.loadingProducts();
    this.loadingClients();

    this.form.valueChanges.subscribe(() => {
      this.filterProducts();
      this.filterClients();
    });

    // Ao selecionar um produto
    this.form.get('productId')?.valueChanges.subscribe((product: Product) => {
      // Limpar campos dependentes
      this.form.patchValue({
        unitId: null,
        quantity: null,
      });

      // Limpar conversões do produto anterior
      this.productUnitConversions = [];

      // Buscar conversões do produto selecionado
      if (product?.id) {
        this.findProductUnitConversionByProductId(product.id);
      }
    });

    // Ao selecionar uma unidade
    this.form.get('unitId')?.valueChanges.subscribe((unitId: number) => {
      // Limpar quantidade sempre que mudar a unidade
      this.form.patchValue({
        quantity: null
      });
    });

    this.form.get('clientId')?.valueChanges.subscribe((client: Client) => {
      if (client?.id) {
        this.selectedClient = client;
      } else {
        this.selectedClient = null;
      }
    });
  }

  // Filtro produtos
  filterProducts() {
    const value = this.form.get('productId')?.value;

    if (typeof value === 'string') {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredProducts = this.products;
    }
  }

  // Filtro clientes
  filterClients() {
    const value = this.form.get('clientId')?.value;

    if (typeof value === 'string') {
      this.filteredClients = this.clients.filter(c =>
        c.firstName.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredClients = this.clients;
    }
  }

  // Mostrar nome no input
  displayProduct(prod: Product): string {
    return prod?.name || '';
  }

  displayClient(client: any): string {
    const first = client?.firstName;
    return `${first}`.trim();
  }

  loadingProducts() {
    this.productService.findAllProductsWithConversionByStatus().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
      },
      error: (err) => console.error('Erro ao carregar produtos:', err)
    });
  }

  loadingClients() {
    this.clientService.findAll(0, 100, '', 'asc').subscribe({
      next: (data) => {
        this.clients = data._embedded.client;
        this.filteredClients = data._embedded.clients;
      },
      error: (err) => console.error('Erro ao carregar clientes:', err)
    });
  }

  findProductUnitConversionByProductId(productId: number) {
    this.productUnitConversionService.findByProductId(productId).subscribe({
      next: (data) => {
        this.productUnitConversions = data;
      },
      error: (err) => this.snackbar.error('Erro ao carregar conversões:', err)
    });
  }

  addItem() {
    // Verificar se os campos obrigatórios estão preenchidos
    const product: Product = this.form.value.productId;
    const unitId: number = this.form.value.unitId;
    const quantity: number = this.form.value.quantity;

    if (!product) {
      this.snackbar.error('Selecione um produto.');
      return;
    }

    if (!unitId) {
      this.snackbar.error('Selecione uma unidade.');
      return;
    }

    if (!quantity || quantity <= 0) {
      this.snackbar.error('Digite uma quantidade válida.');
      return;
    }

    this.stockService.findByProductId(product.id!).subscribe({
      next: (stock) => {
        console.log('Verificando estoque para produto:', stock);
        if (stock.quantity < quantity) {
          this.snackbar.error('Quantidade em estoque insuficiente.');
          return;
        } else {
          this.addItemToSale(product, unitId, quantity);
        }
      },
      error: (err) => {
        console.error('Erro ao verificar estoque:', err);
        this.snackbar.error('Erro ao verificar estoque. Tente novamente.');
      }
    });
  }

  private addItemToSale(product: Product, unitId: number, quantity: number) {

    // Encontrar a conversão selecionada
    const conversion = this.productUnitConversions.find(
      c => c.unit?.id === unitId
    );

    if (!conversion) {
      this.snackbar.error('Selecione uma unidade válida.');
      return;
    }

    // Converter quantidade para a unidade base do produto
    const convertedQuantity = quantity * conversion.conversionFactor;

    // Calcular subtotal
    const subTotal = convertedQuantity * product.unitPrice;

    // Montar item da venda
    const item: SaleItem = {
      productId: product.id!,
      product: product,
      quantity: convertedQuantity,
      productUnitConversion: conversion,
      productUnitConversionId: conversion.id!,
    };

    // Adicionar à lista e atualizar tabela
    this.saleItems.push(item);
    this.dataSource.data = this.saleItems;

    if (this.saleItems.length >= 1 && this.selectedClient) {
      this.form.get('clientId')?.disable();
    }

    // Atualizar total da venda
    this.calculateTotal();

    // Resetar formulário
    this.form.patchValue({
      productId: null,
      unitId: null,
      quantity: null
    });

    // Limpar conversões do produto anterior
    this.productUnitConversions = [];
  }

  calculateTotal() {
    const total = this.saleItems.reduce((sum, item) => {
      const price = item.product?.unitPrice || 0;
      return sum + (item.quantity * price);
    }, 0);

    this.valueSale = total;
    this.sale.totalValue = total;
  }

  editItem(item: SaleItem) {
    // Preencher formulário
    this.form.patchValue({
      productId: item.product,
      unitId: item.productUnitConversion?.unit?.id,
      quantity: item.quantity
    });

    // Remover temporariamente para não duplicar
    this.removeItem(item);
  }

  removeItem(item: SaleItem) {
    this.saleItems = this.saleItems.filter(i => i !== item);
    this.dataSource.data = [...this.saleItems];

    if (this.saleItems.length === 0) {
      this.form.get('clientId')?.enable();
      this.form.get('clientId')?.setValue(null);
    }

    this.calculateTotal();
  }

  processSale() {
    if (this.saleItems.length === 0) {
      this.snackbar.error('Adicione pelo menos um item para finalizar a venda.');
      return;
    }

    this.saleRequest = {
      sale: {
        clientId: this.selectedClient?.id,
        totalValue: this.sale.totalValue,
        saleStatus: SaleStatus.COMPLETED
      },
      items: this.saleItems
    };

    console.log('SaleRequest:', this.saleRequest);

    this.saleService.create(this.saleRequest).subscribe({
      next: () => {
        this.snackbar.success('Venda processada com sucesso!');
        // Resetar tudo
        this.saleItems = [];
        this.dataSource.data = [];
        this.selectedClient = null;
        this.form.reset();
        this.form.get('clientId')?.enable();
        this.valueSale = 0;
      },
      error: (err) => {
        console.error('Erro ao processar venda:', err);
        this.snackbar.error(err.error||'Erro ao processar venda. Tente novamente.');
      }
    });


  }

  getImage(image: string | undefined): string {
    if (!image) return 'assets/No_Image.svg.png';
    return image.startsWith('data:')
      ? image
      : 'data:image/jpeg;base64,' + image;
  }

}
