import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ClientService } from '@app/services/client.service';
import { ConsumptionService } from '@app/services/consumption.service';
import { Client } from '@app/shared/models/client';
import { finalize, debounceTime } from 'rxjs/operators';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { curveMonotoneX } from 'd3-shape';

import {
  NbCardModule,
  NbIconModule,
  NbSelectModule,
  NbListModule,
  NbButtonModule,
  NbInputModule,
  NbSpinnerModule,
  NbDatepickerModule,
  NbToastrService
} from '@nebular/theme';
import { CertificadoDashboardDTO, CertificadoService } from '@app/services/certificado.service';

type ViewMode = 'MONTHLY' | 'YEARLY' | 'RANGE' | 'MONTHCOMPARATION' | 'YEARCOMPARATION' | 'ENTRADA_VS_SAIDA';
type PontoSerie = { name: string; value: number };

@Component({
  selector: 'app-dashboard-list',
  templateUrl: './dashboard-list.component.html',
  styleUrls: ['./dashboard-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbListModule,
    NbSpinnerModule,
    NbDatepickerModule,
    NgxChartsModule
  ]
})
export class DashboardListComponent implements OnInit, OnDestroy {
  isLoading = false;
  spinnerVisible = false;

  /** Muda para false se quiseres desligar por completo as animações dos gráficos. */
  readonly chartAnimations = true;

  readonly CONSTANTE_ENERGIA_STD = 1.05491;
  readonly DEFAULT_ROLLOVER_LIMIT = 99999999;

  energyContentMjSm3: number | null = null;
  totalRegistos = 0;

  areaChartDataM3: any[] = [{ name: 'Consumo Real (m³)', series: [] }];
  areaChartDataGJ: any[] = [{ name: 'Energia Real (GJ)', series: [] }];

  selectedClientIds: (number | string)[] = ['ALL'];
  viewMode: ViewMode | null = null;
  selectedMonth2: number | null = null;
  selectedYear2: number | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  anos = [2024, 2025, 2026];

  totalVolumeConsumido = 0;
  energyStd = 0;
  totalEnergiaConsumidaGJ = 0;

  mediaConsumoDiarioM3 = 0;
  mediaConsumoDiarioGJ = 0;
  totalClientes = 0;
  selectedCategories: string[] = ['ALL'];

  colorSchemeDonut: any = { domain: ['#00d68f', '#3366ff', '#ffaa00', '#32dbf0', '#ff3d71'] };
  /** Esquema usado nos gráficos de linha (estável: só muda quando muda o nº de séries). */
  colorSchemeLinhas: any = this.colorSchemeDonut;

  topConsumersData: { name: string; value: number; percent?: number }[] = [];
  topConsumersDataGJ: { name: string; value: number }[] = [];
  listaClientes: Client[] = [];
  /** Lista já filtrada por categoria (propriedade, não getter, para manter referência estável). */
  listaClientesFiltradaPorCategoria: Client[] = [];
  private clientesPorId = new Map<number, Client>();

  monthlyEnergyContent: (number | null)[] = new Array(12).fill(null);

  showAdvancedKpis = false;
  tarifaPorM3: number | null = null;
  metaConsumoM3: number | null = null;
  variacaoPercentual: number | null = null;
  totalVolumeAnterior: number | null = null;
  picoConsumo: { value: number; label: string } | null = null;
  minimoConsumo: { value: number; label: string } | null = null;
  eficienciaEnergetica = 0;
  dataQualityScore = 0;
  custoEstimado = 0;
  percentualMeta: number | null = null;
  volumePorCliente: PontoSerie[] = [];

  /** Linhas de referência (propriedades estáveis, evitam redesenhos constantes do ngx-charts). */
  referenciasM3: PontoSerie[] = [];
  referenciasGJ: PontoSerie[] = [];

  readonly curveSuave = curveMonotoneX;
  entradaAtiva: any[] = [];

  private energyChangeSubject = new Subject<void>();
  private energySubscription: Subscription;

  constructor(
    private clientService: ClientService,
    private certificadoService: CertificadoService,
    private consumptionService: ConsumptionService,
    private cdr: ChangeDetectorRef,
    private toastrService: NbToastrService,
  ) {
    // Debounce de 300ms. NÃO usar distinctUntilChanged aqui: o Subject<void> emite sempre
    // "undefined" e só deixaria passar a primeira alteração.
    this.energySubscription = this.energyChangeSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.recalcularEnergiaComNovoEnergyContent();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.resetMetrics();
    this.carregarListaClientes();
  }

  ngOnDestroy(): void {
    this.energySubscription?.unsubscribe();
  }

  // ===================== TRACKBY / FORMATADORES =====================

  trackByName = (_: number, item: { name: string }) => item.name;
  trackByClientId = (_: number, c: Client) => c.id;
  trackByIndex = (i: number) => i;

  /** Arrow function: mantém o `this` e uma referência estável para o ngx-charts. */
  formatarDataLabel = (val: number): string => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString();
  };

  // ===================== CARREGAMENTO INICIAL =====================

  carregarListaClientes(): void {
    this.clientService.findAll(0, 1000, 'firstName', 'asc', '').subscribe({
      next: (res: any) => {
        this.listaClientes = this.extrairLista(res);
        this.clientesPorId = new Map(
          this.listaClientes
            .filter(c => c.id !== undefined && c.id !== null)
            .map(c => [Number(c.id), c] as [number, Client])
        );
        this.totalClientes = this.listaClientes.length;
        this.atualizarListaClientesFiltrada();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erro ao carregar clientes:', err)
    });
  }

  // ===================== EVENTOS DE FILTROS =====================

  onViewModeChange(): void {
    if (!this.viewMode) return;
    this.resetMetrics();
    this.selectedMonth = null;
    this.selectedYear = null;
    this.selectedMonth2 = null;
    this.selectedYear2 = null;
    this.startDate = null;
    this.endDate = null;
    this.monthlyEnergyContent = new Array(12).fill(null);
    this.cdr.markForCheck();
  }

  onCategoriaSelecionadaChange(categoriasSelecionadas: string[] | string | null): void {
    const cats: string[] = Array.isArray(categoriasSelecionadas)
      ? categoriasSelecionadas
      : (categoriasSelecionadas !== null && categoriasSelecionadas !== undefined ? [categoriasSelecionadas] : []);

    this.selectedCategories = this.normalizarSelecaoComAll(cats, this.selectedCategories) as string[];
    this.atualizarListaClientesFiltrada();

    if (this.isFiltrosCompletos()) {
      this.recarregarDadosDashboard();
    } else {
      this.resetMetrics();
    }
    this.cdr.markForCheck();
  }

  onClienteSelecionadoChange(idsSelecionados: (number | string)[] | number | string | null): void {
    const ids: (number | string)[] = Array.isArray(idsSelecionados)
      ? idsSelecionados
      : (idsSelecionados !== null && idsSelecionados !== undefined ? [idsSelecionados] : []);

    this.selectedClientIds = this.normalizarSelecaoComAll(ids, this.selectedClientIds);

    if (this.isFiltrosCompletos()) {
      this.recarregarDadosDashboard();
    } else {
      this.resetMetrics();
    }
    this.cdr.markForCheck();
  }

  /** Lógica partilhada da opção "ALL" nos multi-selects. */
  private normalizarSelecaoComAll(
    novos: (number | string)[],
    anteriores: (number | string)[]
  ): (number | string)[] {
    if (novos.length === 0) return ['ALL'];

    const tinhaAllAntes = anteriores.includes('ALL');
    const temAllAgora = novos.includes('ALL');

    if (temAllAgora && !tinhaAllAntes) return ['ALL'];
    if (temAllAgora && tinhaAllAntes && novos.length > 1) return novos.filter(v => v !== 'ALL');
    if (temAllAgora && novos.length === 1) return ['ALL'];
    return novos;
  }

  private getClientIdsSelecionados(): number[] {
    return this.selectedClientIds
      .filter(id => id !== 'ALL')
      .map(id => Number(id))
      .filter(id => !isNaN(id));
  }

  onEnergyContentChange(): void {
    this.energyChangeSubject.next();
  }

  onTarifaChange(): void {
    this.recalcularKpisDerivados();
  }

  onMetaChange(): void {
    this.recalcularKpisDerivados();
  }

  onHoverCliente(nome: string): void {
    this.entradaAtiva = [{ name: nome }];
  }

  onHoverClienteFim(): void {
    this.entradaAtiva = [];
  }

  onGraficoClicado(evento: any): void {
    const nome = evento?.name ?? evento?.label ?? null;
    if (!nome) return;

    const cliente = this.listaClientes.find(c => c.firstName === nome);
    if (!cliente || cliente.id === undefined || cliente.id === null) return;

    this.onClienteSelecionadoChange([cliente.id]);
    this.toastrService.info(`A filtrar por ${cliente.firstName}`, 'Cliente selecionado', { duration: 2500 });
  }

  // ===================== CATEGORIAS =====================

  private get incluiEntradas(): boolean {
    return this.selectedCategories.includes('ALL') || this.selectedCategories.includes('ENTRADAS');
  }

  private get incluiSaidas(): boolean {
    return this.selectedCategories.includes('ALL') || this.selectedCategories.includes('SAIDAS');
  }

  private atualizarListaClientesFiltrada(): void {
    if (!this.listaClientes) {
      this.listaClientesFiltradaPorCategoria = [];
      return;
    }

    if (this.incluiEntradas && this.incluiSaidas) {
      this.listaClientesFiltradaPorCategoria = this.listaClientes;
      return;
    }

    this.listaClientesFiltradaPorCategoria = this.listaClientes.filter(c => {
      const eEntrada = this.isClienteEntrada(c);
      return (this.incluiEntradas && eEntrada) || (this.incluiSaidas && !eEntrada);
    });
  }

  getClientIdsPorCategoria(): number[] {
    return this.listaClientesFiltradaPorCategoria
      .map(c => Number(c.id))
      .filter(id => !isNaN(id));
  }

  isFiltrosCompletos(): boolean {
    const hasValidClients = this.selectedClientIds && this.selectedClientIds.length > 0;
    const hasValidCategories = this.selectedCategories && this.selectedCategories.length > 0;

    if (!hasValidClients || !hasValidCategories || !this.viewMode) return false;

    switch (this.viewMode) {
      case 'MONTHLY':
        return this.selectedMonth !== null && this.selectedYear !== null;
      case 'YEARLY':
        return this.selectedYear !== null;
      case 'RANGE':
        return !!this.startDate && !!this.endDate;
      case 'MONTHCOMPARATION':
        return this.selectedMonth !== null &&
               this.selectedYear !== null &&
               this.selectedMonth2 !== null &&
               this.selectedYear2 !== null;
      case 'YEARCOMPARATION':
        return this.selectedYear !== null && this.selectedYear2 !== null;
      case 'ENTRADA_VS_SAIDA':
        return true;
      default:
        return false;
    }
  }

  isClienteEntrada(cliente: Client | undefined | null): boolean {
    if (!cliente || !cliente.firstName) return false;
    const nomeTrim = cliente.firstName.trim().toUpperCase();
    return (
      nomeTrim === 'PRS1' || nomeTrim.startsWith('PRS1 ') ||
      nomeTrim === 'HPCMS3' || nomeTrim.startsWith('HPCMS3 ')
    );
  }

  // ===================== PEDIDOS AO BACKEND =====================

  recarregarDadosDashboard(): void {
    if (!this.selectedClientIds || this.selectedClientIds.length === 0 || !this.isFiltrosCompletos()) {
      this.resetMetrics();
      return;
    }

    const clientIdsCategorizados = this.getClientIdsPorCategoria();
    const clientIdsNumericos = this.getClientIdsSelecionados();

    let clientIdsParam: number[] | undefined;
    if (this.isAllClientsSelected) {
      clientIdsParam = clientIdsCategorizados.length > 0 ? clientIdsCategorizados : undefined;
    } else {
      const filtrados = clientIdsNumericos.filter(id => clientIdsCategorizados.includes(id));
      clientIdsParam = filtrados.length > 0 ? filtrados : [-1];
    }

    this.spinnerVisible = true;
    this.cdr.markForCheck();

    const fim = () => {
      this.spinnerVisible = false;
      this.cdr.markForCheck();
    };

    if (this.viewMode === 'MONTHCOMPARATION') {
      if (this.selectedYear === null || this.selectedMonth === null || this.selectedYear2 === null || this.selectedMonth2 === null) {
        fim();
        return;
      }

      const [start1, end1] = this.intervaloMes(Number(this.selectedYear), Number(this.selectedMonth));
      const [start2, end2] = this.intervaloMes(Number(this.selectedYear2), Number(this.selectedMonth2));

      forkJoin({
        p1: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', { clientIds: clientIdsParam, startDate: start1, endDate: end1 }),
        p2: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', { clientIds: clientIdsParam, startDate: start2, endDate: end2 })
      })
      .pipe(finalize(fim))
      .subscribe({
        next: (res: any) => this.processarComparacaoMensal(res.p1, res.p2),
        error: (err) => {
          console.error('Erro ao comparar meses:', err);
          this.resetMetrics();
        }
      });
      return;
    }

    if (this.viewMode === 'YEARCOMPARATION') {
      if (this.selectedYear === null || this.selectedYear2 === null) {
        fim();
        return;
      }

      const [start1, end1] = this.intervaloAno(Number(this.selectedYear));
      const [start2, end2] = this.intervaloAno(Number(this.selectedYear2));

      forkJoin({
        p1: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', { clientIds: clientIdsParam, startDate: start1, endDate: end1 }),
        p2: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', { clientIds: clientIdsParam, startDate: start2, endDate: end2 })
      })
      .pipe(finalize(fim))
      .subscribe({
        next: (res: any) => this.processarComparacaoAnual(res.p1, res.p2),
        error: (err) => {
          console.error('Erro ao comparar anos:', err);
          this.resetMetrics();
        }
      });
      return;
    }

    if (this.viewMode === 'ENTRADA_VS_SAIDA') {
      let startIso: string | undefined;
      let endIso: string | undefined;

      if (this.selectedYear !== null && this.selectedMonth !== null) {
        [startIso, endIso] = this.intervaloMes(this.selectedYear, this.selectedMonth);
      } else if (this.selectedYear !== null) {
        [startIso, endIso] = this.intervaloAno(this.selectedYear);
      }

      this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
        startDate: startIso,
        endDate: endIso
      })
      .pipe(finalize(fim))
      .subscribe({
        next: (res: any) => this.processarComparacaoEntradaSaida(this.extrairLista(res)),
        error: (err) => {
          console.error('Erro ao carregar dados comparativos:', err);
          this.resetMetrics();
        }
      });
      return;
    }

    let startIso: string | undefined;
    let endIso: string | undefined;

    if (this.viewMode === 'MONTHLY' && this.selectedMonth !== null && this.selectedYear !== null) {
      [startIso, endIso] = this.intervaloMes(this.selectedYear, this.selectedMonth);
    } else if (this.viewMode === 'YEARLY' && this.selectedYear !== null) {
      [startIso, endIso] = this.intervaloAno(this.selectedYear);
    } else if (this.viewMode === 'RANGE' && this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59);
      startIso = this.formatDateTimeToIso(start);
      endIso = this.formatDateTimeToIso(end);
    }

    this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
      clientIds: clientIdsParam,
      startDate: startIso,
      endDate: endIso
    })
    .pipe(finalize(fim))
    .subscribe({
      next: (res: any) => this.processarDadosConsumo(this.extrairLista(res)),
      error: (err) => {
        console.error('Erro ao carregar consumos:', err);
        this.resetMetrics();
      }
    });
  }

  // ===================== PROCESSAMENTO =====================

  private processarDadosConsumo(consumptions: any[]): void {
    if (!Array.isArray(consumptions) || consumptions.length === 0) {
      this.resetMetrics();
      return;
    }

    const ordenados = this.ordenarPorData(consumptions);
    const len = ordenados.length;
    const clientIdsPermitidos = new Set(this.getClientIdsPorCategoria());

    const perClientChartMap = new Map<string, Map<string, number>>();
    const previousReadingMap = new Map<number, number>();
    const clientTotalVolumeMap = new Map<string, number>();

    for (let i = 0; i < len; i++) {
      const c = ordenados[i];
      if (!c) continue;

      if (i === 0 && (c.energyContent || c.energy_content) && !this.energyContentMjSm3) {
        this.energyContentMjSm3 = Number(c.energyContent || c.energy_content);
      }

      const clientIdNum = Number(c.clientId ?? c.client?.id ?? c.client_id ?? 0);

      if (clientIdsPermitidos.size > 0 && !clientIdsPermitidos.has(clientIdNum)) {
        continue;
      }

      const cliente = this.clientesPorId.get(clientIdNum);
      const clientName = c.client?.firstName || cliente?.firstName || `Cliente #${clientIdNum}`;

      const deltaVolume = this.calcularDeltaRegisto(c, clientIdNum, previousReadingMap);
      if (deltaVolume === null) {
        if (!clientTotalVolumeMap.has(clientName)) clientTotalVolumeMap.set(clientName, 0);
        continue;
      }

      clientTotalVolumeMap.set(clientName, (clientTotalVolumeMap.get(clientName) || 0) + deltaVolume);

      const dateKey = this.gerarChaveData(c);
      let clientMap = perClientChartMap.get(clientName);
      if (!clientMap) {
        clientMap = new Map<string, number>();
        perClientChartMap.set(clientName, clientMap);
      }
      clientMap.set(dateKey, (clientMap.get(dateKey) || 0) + deltaVolume);
    }

    let totalVbM3 = 0;
    const topConsumers: { name: string; value: number; percent?: number }[] = [];

    clientTotalVolumeMap.forEach((vbCliente, clientName) => {
      totalVbM3 += vbCliente;
      topConsumers.push({ name: clientName, value: vbCliente });
    });

    this.volumePorCliente = Array.from(clientTotalVolumeMap.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    this.totalVolumeConsumido = Number(totalVbM3.toFixed(2));
    this.totalRegistos = len;

    const maiorMapSize = perClientChartMap.size > 0
      ? Math.max(...Array.from(perClientChartMap.values()).map(m => m.size))
      : 0;

    const totalDiasMes = (this.selectedYear && this.selectedMonth !== null)
      ? new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate()
      : (maiorMapSize || 1);

    this.mediaConsumoDiarioM3 = this.totalVolumeConsumido / (totalDiasMes || 1);

    this.areaChartDataM3 = this.construirSeriesM3(perClientChartMap);

    for (const t of topConsumers) {
      t.percent = this.totalVolumeConsumido > 0 ? (t.value / this.totalVolumeConsumido) * 100 : 0;
    }
    topConsumers.sort((a, b) => b.value - a.value);
    this.topConsumersData = topConsumers.slice(0, 5);

    const datasetsParaPico = this.areaChartDataM3.map(ds => ({
      nome: this.areaChartDataM3.length > 1 ? ds.name : '',
      pontos: ds.series
    }));
    const { pico, minimo } = this.encontrarPicoEMinimo(datasetsParaPico);
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    const periodosEsperados = this.calcularPeriodosEsperados();
    this.dataQualityScore = periodosEsperados > 0
      ? Math.min(100, Number(((maiorMapSize / periodosEsperados) * 100).toFixed(0)))
      : 0;

    this.recalcularEnergiaComNovoEnergyContent();
  }

  private processarComparacaoEntradaSaida(consumptions: any[]): void {
    if (!Array.isArray(consumptions) || consumptions.length === 0) {
      this.resetMetrics();
      return;
    }

    const ordenados = this.ordenarPorData(consumptions);

    const mapEntradas = new Map<string, number>();
    const mapSaidas = new Map<string, number>();
    const previousReadingMap = new Map<number, number>();

    let totalEntradaVol = 0;
    let totalSaidaVol = 0;
    let totalRegs = 0;

    for (let i = 0; i < ordenados.length; i++) {
      const c = ordenados[i];
      if (!c) continue;

      if (i === 0 && (c.energyContent || c.energy_content) && !this.energyContentMjSm3) {
        this.energyContentMjSm3 = Number(c.energyContent || c.energy_content);
      }

      const clientIdNum = Number(c.clientId ?? c.client?.id ?? c.client_id ?? 0);
      const eEntrada = this.isClienteEntrada(this.clientesPorId.get(clientIdNum));

      const deltaVolume = this.calcularDeltaRegisto(c, clientIdNum, previousReadingMap);
      if (deltaVolume === null) continue;

      totalRegs++;
      const dateKey = this.gerarChaveData(c);

      if (eEntrada) {
        mapEntradas.set(dateKey, (mapEntradas.get(dateKey) || 0) + deltaVolume);
        totalEntradaVol += deltaVolume;
      } else {
        mapSaidas.set(dateKey, (mapSaidas.get(dateKey) || 0) + deltaVolume);
        totalSaidaVol += deltaVolume;
      }
    }

    const todasDatas = new Set([...mapEntradas.keys(), ...mapSaidas.keys()]);
    const datasOrdenadas = Array.from(todasDatas).sort((a, b) => this.compararLabelsPeriodo(a, b));

    const seriesEntradas = datasOrdenadas.map(d => ({ name: d, value: Number((mapEntradas.get(d) || 0).toFixed(2)) }));
    const seriesSaidas = datasOrdenadas.map(d => ({ name: d, value: Number((mapSaidas.get(d) || 0).toFixed(2)) }));

    this.areaChartDataM3 = [
      { name: '📥 Entradas (PRS1/HPCMS3)', series: seriesEntradas },
      { name: '📤 Saídas (Demais Estações)', series: seriesSaidas }
    ];

    this.totalVolumeConsumido = Number((totalEntradaVol + totalSaidaVol).toFixed(2));
    this.totalRegistos = totalRegs;

    const totalDias = this.calcularPeriodosEsperados() || 1;
    this.mediaConsumoDiarioM3 = this.totalVolumeConsumido / totalDias;

    this.volumePorCliente = [
      { name: '📥 Total Entradas', value: Number(totalEntradaVol.toFixed(2)) },
      { name: '📤 Total Saídas', value: Number(totalSaidaVol.toFixed(2)) }
    ];

    this.recalcularEnergiaComNovoEnergyContent();
  }

  private processarComparacaoMensal(res1: any, res2: any): void {
    const consumptions1 = this.extrairLista(res1);
    const consumptions2 = this.extrairLista(res2);

    const labelPeriodo1 = `${this.meses[this.selectedMonth!]} / ${this.selectedYear}`;
    const labelPeriodo2 = `${this.meses[this.selectedMonth2!]} / ${this.selectedYear2}`;

    const series1 = this.extrairSeriesPorDiaDoMes(consumptions1);
    const series2 = this.extrairSeriesPorDiaDoMes(consumptions2);

    this.aplicarComparacao(consumptions1, consumptions2, series1, series2, labelPeriodo1, labelPeriodo2);
  }

  private processarComparacaoAnual(res1: any, res2: any): void {
    const consumptions1 = this.extrairLista(res1);
    const consumptions2 = this.extrairLista(res2);

    const labelAno1 = `Ano ${this.selectedYear}`;
    const labelAno2 = `Ano ${this.selectedYear2}`;

    const series1 = this.extrairSeriesPorMesDoAno(consumptions1);
    const series2 = this.extrairSeriesPorMesDoAno(consumptions2);

    this.aplicarComparacao(consumptions1, consumptions2, series1, series2, labelAno1, labelAno2);
  }

  /** Lógica comum às comparações mensal/anual. */
  private aplicarComparacao(
    consumptions1: any[], consumptions2: any[],
    series1: PontoSerie[], series2: PontoSerie[],
    label1: string, label2: string
  ): void {
    const vol1 = series1.reduce((acc, curr) => acc + curr.value, 0);
    const vol2 = series2.reduce((acc, curr) => acc + curr.value, 0);

    this.totalVolumeConsumido = Number((vol1 + vol2).toFixed(2));
    this.totalRegistos = consumptions1.length + consumptions2.length;

    this.areaChartDataM3 = [
      { name: label1, series: series1 },
      { name: label2, series: series2 }
    ];

    const dadosSuficientes = consumptions1.length > 0;
    this.totalVolumeAnterior = dadosSuficientes ? Number(vol1.toFixed(2)) : null;
    this.variacaoPercentual = (dadosSuficientes && vol1 > 0)
      ? Number((((vol2 - vol1) / vol1) * 100).toFixed(1))
      : null;

    const { pico, minimo } = this.encontrarPicoEMinimo([
      { nome: label1, pontos: series1 },
      { nome: label2, pontos: series2 }
    ]);
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    this.recalcularEnergiaComNovoEnergyContent();
  }

  private construirSeriesM3(perClientChartMap: Map<string, Map<string, number>>): any[] {
    const nomesClientes = Array.from(perClientChartMap.keys());

    if (nomesClientes.length <= 1) {
      const unico = nomesClientes[0];
      const mapa = unico ? perClientChartMap.get(unico)! : new Map<string, number>();
      const series = Array.from(mapa.entries())
        .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
        .sort((a, b) => this.compararLabelsPeriodo(a.name, b.name));
      return [{ name: 'Consumo Real (m³)', series }];
    }

    const todasDatas = new Set<string>();
    perClientChartMap.forEach(mapa => mapa.forEach((_, data) => todasDatas.add(data)));
    const datasOrdenadas = Array.from(todasDatas).sort((a, b) => this.compararLabelsPeriodo(a, b));

    return nomesClientes.map(nomeCliente => {
      const mapa = perClientChartMap.get(nomeCliente)!;
      const series = datasOrdenadas.map(data => ({
        name: data,
        value: Number((mapa.get(data) || 0).toFixed(2))
      }));
      return { name: nomeCliente, series };
    });
  }

  private extrairSeriesPorDiaDoMes(consumptions: any[]): PontoSerie[] {
    return this.extrairSeriesAgregadas(consumptions, 'DIA');
  }

  private extrairSeriesPorMesDoAno(consumptions: any[]): PontoSerie[] {
    return this.extrairSeriesAgregadas(consumptions, 'MES');
  }

  private extrairSeriesAgregadas(consumptions: any[], modo: 'DIA' | 'MES'): PontoSerie[] {
    if (!Array.isArray(consumptions) || consumptions.length === 0) return [];

    const ordenados = this.ordenarPorData(consumptions);
    const chartMap = new Map<string, number>();
    const previousReadingMap = new Map<number, number>();

    for (const c of ordenados) {
      if (!c) continue;

      const clientIdNum = Number(c.clientId ?? c.client?.id ?? 0);
      const delta = this.calcularDeltaRegisto(c, clientIdNum, previousReadingMap);
      if (delta === null) continue;

      if (c.consumptionDate) {
        const dateVal = new Date(c.consumptionDate);
        if (!isNaN(dateVal.getTime())) {
          const key = modo === 'DIA'
            ? `Dia ${String(dateVal.getDate()).padStart(2, '0')}`
            : this.meses[dateVal.getMonth()];
          chartMap.set(key, (chartMap.get(key) || 0) + delta);
        }
      }
    }

    if (modo === 'MES') {
      return this.meses
        .filter(mes => chartMap.has(mes))
        .map(mes => ({ name: mes, value: Number(chartMap.get(mes)!.toFixed(2)) }));
    }

    return Array.from(chartMap.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => parseInt(a.name.replace('Dia ', ''), 10) - parseInt(b.name.replace('Dia ', ''), 10));
  }

  // ===================== HELPERS DE DADOS =====================

  /** Extrai a lista de registos das várias formas de resposta do backend. */
  private extrairLista(res: any): any[] {
    return res?._embedded?.consumptionDTOList
      || res?._embedded?.consumptions
      || res?._embedded?.clientDTOList
      || res?._embedded?.clients
      || res?.content
      || (Array.isArray(res) ? res : []);
  }

  private ordenarPorData(consumptions: any[]): any[] {
    return [...consumptions].sort(
      (a, b) => new Date(a.consumptionDate).getTime() - new Date(b.consumptionDate).getTime()
    );
  }

  /**
   * Devolve o consumo (delta) de um registo ou null se for a primeira leitura do cliente
   * (que serve apenas de referência para a leitura seguinte).
   */
  private calcularDeltaRegisto(
    c: any,
    clientIdNum: number,
    previousReadingMap: Map<number, number>
  ): number | null {
    const rawReading = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);
    let delta: number;

    if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
      delta = Number(c.deltaVolume);
    } else {
      if (!previousReadingMap.has(clientIdNum)) {
        previousReadingMap.set(clientIdNum, rawReading);
        return null;
      }
      delta = this.calcularDeltaLeitura(
        rawReading,
        previousReadingMap.get(clientIdNum)!,
        c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT
      );
    }

    previousReadingMap.set(clientIdNum, rawReading);
    return delta;
  }

  private gerarChaveData(c: any): string {
    if (!c.consumptionDate) return 'S/D';
    const dateVal = new Date(c.consumptionDate);
    if (isNaN(dateVal.getTime())) return 'S/D';

    return this.viewMode === 'YEARLY'
      ? this.meses[dateVal.getMonth()]
      : `${String(dateVal.getDate()).padStart(2, '0')}/${String(dateVal.getMonth() + 1).padStart(2, '0')}`;
  }

  private compararLabelsPeriodo(a: string, b: string): number {
    const idxA = this.meses.indexOf(a);
    const idxB = this.meses.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;

    const diaMatchA = a.match(/Dia (\d+)/);
    const diaMatchB = b.match(/Dia (\d+)/);
    if (diaMatchA && diaMatchB) {
      return Number(diaMatchA[1]) - Number(diaMatchB[1]);
    }

    const ddmmA = a.match(/^(\d{2})\/(\d{2})$/);
    const ddmmB = b.match(/^(\d{2})\/(\d{2})$/);
    if (ddmmA && ddmmB) {
      const da = Number(ddmmA[1]), ma = Number(ddmmA[2]);
      const db = Number(ddmmB[1]), mb = Number(ddmmB[2]);
      if (ma !== mb) return ma - mb;
      return da - db;
    }

    return a.localeCompare(b);
  }

  private intervaloMes(ano: number, mes: number): [string, string] {
    const start = new Date(ano, mes, 1, 0, 0, 0);
    const end = new Date(ano, mes + 1, 0, 23, 59, 59);
    return [this.formatDateTimeToIso(start), this.formatDateTimeToIso(end)];
  }

  private intervaloAno(ano: number): [string, string] {
    return [
      this.formatDateTimeToIso(new Date(ano, 0, 1, 0, 0, 0)),
      this.formatDateTimeToIso(new Date(ano, 11, 31, 23, 59, 59))
    ];
  }

  private formatDateTimeToIso(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private calcularDeltaLeitura(leituraAtual: number, leituraAnterior: number, tetoRollover: number = this.DEFAULT_ROLLOVER_LIMIT): number {
    if (isNaN(leituraAtual) || isNaN(leituraAnterior)) return 0;
    if (leituraAtual >= leituraAnterior) return leituraAtual - leituraAnterior;
    const deltaRestanteAteLimite = tetoRollover - leituraAnterior;
    return deltaRestanteAteLimite < 0 ? 0 : deltaRestanteAteLimite + leituraAtual;
  }

  // ===================== ENERGIA E KPIs =====================

  private recalcularEnergiaComNovoEnergyContent(): void {
    const temSeries = this.areaChartDataM3.some(dataset => dataset?.series?.length > 0);

    if (temSeries) {
      let totalEnergiaAcumuladaGJ = 0;

      const novasSeriesGJ = this.areaChartDataM3.map((dataset: any) => {
        const seriesConvertida = (dataset.series || []).map((item: any) => {
          let contentParaCalculo = Number(this.energyContentMjSm3);

          if (this.viewMode === 'YEARLY') {
            const indexMes = this.meses.indexOf(item.name);
            if (indexMes !== -1 && Number(this.monthlyEnergyContent[indexMes]) > 0) {
              contentParaCalculo = Number(this.monthlyEnergyContent[indexMes]);
            }
          }

          const energyStdItem = contentParaCalculo > 0
            ? (this.CONSTANTE_ENERGIA_STD / contentParaCalculo) * 1000
            : 0;
          const energiaGJ = energyStdItem > 0
            ? Number((item.value / energyStdItem).toFixed(2))
            : 0;

          totalEnergiaAcumuladaGJ += energiaGJ;
          return { name: item.name, value: energiaGJ };
        });

        return { name: dataset.name, series: seriesConvertida };
      });

      const globalContent = Number(this.energyContentMjSm3);
      this.energyStd = globalContent > 0
        ? Number(((this.CONSTANTE_ENERGIA_STD / globalContent) * 1000).toFixed(3))
        : 0;
      this.totalEnergiaConsumidaGJ = Number(totalEnergiaAcumuladaGJ.toFixed(2));
      this.areaChartDataGJ = novasSeriesGJ;

      const totalDiasCalculo = this.calcularPeriodosEsperados() || 1;
      this.mediaConsumoDiarioGJ = this.totalEnergiaConsumidaGJ / totalDiasCalculo;
    } else {
      this.energyStd = 0;
      this.totalEnergiaConsumidaGJ = 0;
      this.mediaConsumoDiarioGJ = 0;
      this.areaChartDataGJ = [{ name: 'Energia (GJ)', series: [] }];
    }

    this.recalcularKpisDerivados();
    this.atualizarApoioGraficos();
  }

  private recalcularKpisDerivados(): void {
    this.eficienciaEnergetica = this.totalVolumeConsumido > 0
      ? Number((this.totalEnergiaConsumidaGJ / this.totalVolumeConsumido).toFixed(4))
      : 0;

    this.custoEstimado = (this.tarifaPorM3 && this.tarifaPorM3 > 0)
      ? Number((this.totalVolumeConsumido * this.tarifaPorM3).toFixed(2))
      : 0;

    this.percentualMeta = (this.metaConsumoM3 && this.metaConsumoM3 > 0)
      ? Number(((this.totalVolumeConsumido / this.metaConsumoM3) * 100).toFixed(1))
      : null;
  }

  /** Atualiza referências e cores UMA vez por carregamento (e não a cada ciclo de deteção de mudanças). */
  private atualizarApoioGraficos(): void {
    this.referenciasM3 = this.mediaConsumoDiarioM3 > 0
      ? [{ name: 'Média', value: Number(this.mediaConsumoDiarioM3.toFixed(2)) }]
      : [];

    this.referenciasGJ = this.mediaConsumoDiarioGJ > 0
      ? [{ name: 'Média', value: Number(this.mediaConsumoDiarioGJ.toFixed(2)) }]
      : [];

    const baseCores: string[] = this.colorSchemeDonut.domain;
    const qtdSeries = this.areaChartDataM3.length;

    if (qtdSeries <= baseCores.length) {
      this.colorSchemeLinhas = this.colorSchemeDonut;
    } else {
      const extras: string[] = [];
      for (let i = baseCores.length; i < qtdSeries; i++) {
        extras.push(`hsl(${(i * 137.508) % 360}, 65%, 55%)`);
      }
      this.colorSchemeLinhas = { domain: [...baseCores, ...extras] };
    }
  }

  private resetMetrics(): void {
    this.totalVolumeConsumido = 0;
    this.energyStd = 0;
    this.totalEnergiaConsumidaGJ = 0;
    this.mediaConsumoDiarioM3 = 0;
    this.mediaConsumoDiarioGJ = 0;
    this.totalRegistos = 0;
    this.areaChartDataM3 = [{ name: 'Consumo Real (m³)', series: [] }];
    this.areaChartDataGJ = [{ name: 'Energia Real (GJ)', series: [] }];
    this.topConsumersData = [];
    this.topConsumersDataGJ = [];
    this.variacaoPercentual = null;
    this.totalVolumeAnterior = null;
    this.picoConsumo = null;
    this.minimoConsumo = null;
    this.dataQualityScore = 0;
    this.eficienciaEnergetica = 0;
    this.custoEstimado = 0;
    this.percentualMeta = null;
    this.volumePorCliente = [];
    this.atualizarApoioGraficos();
  }

  private encontrarPicoEMinimo(
    datasets: { nome: string; pontos: PontoSerie[] }[]
  ): { pico: { value: number; label: string } | null; minimo: { value: number; label: string } | null } {
    let pico: { value: number; label: string } | null = null;
    let minimo: { value: number; label: string } | null = null;

    for (const { nome, pontos } of datasets) {
      for (const ponto of pontos) {
        const label = nome ? `${nome} - ${ponto.name}` : ponto.name;
        if (!pico || ponto.value > pico.value) pico = { value: ponto.value, label };
        if (!minimo || ponto.value < minimo.value) minimo = { value: ponto.value, label };
      }
    }

    return { pico, minimo };
  }

  private diasNoMes(ano: number, mesIndex: number): number {
    return new Date(ano, mesIndex + 1, 0).getDate();
  }

  private calcularPeriodosEsperados(): number {
    if (this.viewMode === 'MONTHLY' && this.selectedMonth !== null && this.selectedYear !== null) {
      return this.diasNoMes(this.selectedYear, this.selectedMonth);
    }
    if (this.viewMode === 'YEARLY' && this.selectedYear !== null) {
      const eBissexto = (this.selectedYear % 4 === 0 && this.selectedYear % 100 !== 0) || (this.selectedYear % 400 === 0);
      return eBissexto ? 366 : 365;
    }
    if (this.viewMode === 'RANGE' && this.startDate && this.endDate) {
      const diffMs = new Date(this.endDate).getTime() - new Date(this.startDate).getTime();
      return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }
    return 0;
  }

  // ===================== CERTIFICADO =====================

  emitirCertificado(): void {
    if (!this.isFiltrosValidosForCertificado) {
      this.toastrService.warning('Selecione os filtros antes de emitir.', 'Filtros Incompletos');
      return;
    }

    const nomeMes = this.selectedMonth !== null ? this.meses[this.selectedMonth] : '';
    const mesAnoFormatado = `${nomeMes} / ${this.selectedYear}`;

    const payload: CertificadoDashboardDTO = {
      customerName: this.nomeClienteSelecionado,
      monthYear: mesAnoFormatado,
      totalVolumeM3: this.totalVolumeConsumido,
      totalEnergyGj: this.totalEnergiaConsumidaGJ,
      dailyAvgM3: this.mediaConsumoDiarioM3,
      dailyAvgGj: this.mediaConsumoDiarioGJ,
      energyContentMjSm3: this.energyContentMjSm3
    };

    this.spinnerVisible = true;
    this.cdr.markForCheck();

    this.certificadoService.gerarCertificado(payload).subscribe({
      next: (blob: Blob) => {
        this.spinnerVisible = false;
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        this.toastrService.success('Certificado gerado com sucesso!', 'Sucesso');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.spinnerVisible = false;
        console.error('Erro ao gerar certificado:', err);
        this.toastrService.danger('Erro ao gerar o PDF.', 'Erro');
        this.cdr.markForCheck();
      }
    });
  }

  // ===================== GETTERS LEVES =====================

  get isFiltrosValidosForCertificado(): boolean {
    if (this.isAllClientsSelected || this.isMultiplosClientesSelecionados || !this.viewMode) return false;
    if (this.viewMode === 'MONTHLY') return this.selectedMonth !== null && this.selectedYear !== null;
    if (this.viewMode === 'YEARLY') return this.selectedYear !== null;
    if (this.viewMode === 'RANGE') return !!this.startDate && !!this.endDate;
    return false;
  }

  get isAllClientsSelected(): boolean {
    return !this.selectedClientIds || this.selectedClientIds.length === 0 || this.selectedClientIds.includes('ALL');
  }

  get isMultiplosClientesSelecionados(): boolean {
    return !this.isAllClientsSelected && this.selectedClientIds.length > 1;
  }

  get nomeClienteSelecionado(): string {
    if (this.isAllClientsSelected) return 'Todos os Clientes';

    const nomes = this.selectedClientIds
      .map(id => this.clientesPorId.get(Number(id))?.firstName)
      .filter((nome): nome is string => !!nome);

    if (nomes.length === 0) return '';
    if (nomes.length <= 3) return nomes.join(', ');
    return `${nomes.slice(0, 3).join(', ')} +${nomes.length - 3}`;
  }
}