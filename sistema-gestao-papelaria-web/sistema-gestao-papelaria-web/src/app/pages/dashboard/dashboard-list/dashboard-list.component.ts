import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ClientService } from '@app/services/client.service';
import { ConsumptionService } from '@app/services/consumption.service';
import { Client } from '@app/shared/models/client';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { curveMonotoneX } from 'd3-shape';

import { 
  NbCardModule, 
  NbIconModule, 
  NbSelectModule, 
  NbListModule, 
  NbButtonModule,
  NbSpinnerModule,
  NbDatepickerModule,
  NbToastrService
} from '@nebular/theme';
import { CertificadoDashboardDTO, CertificadoService } from '@app/services/certificado.service';

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
    NbSelectModule,
    NbListModule,
    NbSpinnerModule,
    NbDatepickerModule,
    NgxChartsModule
  ]
})
export class DashboardListComponent implements OnInit {
  isLoading = false;
  spinnerVisible = false;

  readonly CONSTANTE_ENERGIA_STD = 1.05491;
  energyContentMjSm3: number | null = null; 
  totalRegistos: number = 0;
  
  areaChartDataM3: any[] = [{ name: 'Consumo Real (m³)', series: [] }];
  areaChartDataGJ: any[] = [{ name: 'Energia Real (GJ)', series: [] }];
  
  selectedClientIds: (number | string)[] = ['ALL'];
  viewMode: 'MONTHLY' | 'YEARLY' | 'RANGE' | 'MONTHCOMPARATION' | 'YEARCOMPARATION' | null = null;
  selectedMonth2: number | null = null;
  selectedYear2: number | null = null;  
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedMonth: number | null = null; 
  selectedYear: number | null = null; 

  meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  anos = [2024, 2025, 2026];

  totalVolumeConsumido: number = 0;   
  energyStd: number = 0;              
  totalEnergiaConsumidaGJ: number = 0;
  
  mediaConsumoDiarioM3: number = 0;   
  mediaConsumoDiarioGJ: number = 0;   
  totalClientes: number = 0;

  colorScheme: any = { domain: ['#3366ff', '#00d68f', '#ffaa00', '#0095ff', '#a16eff'] };
  colorSchemeGJ: any = { domain: ['#ffaa00', '#ff3d71', '#3366ff', '#00d68f', '#a16eff'] };
  colorSchemeDonut: any = { domain: ['#00d68f', '#3366ff', '#ffaa00', '#32dbf0', '#ff3d71'] };

  topConsumersData: { name: string; value: number; percent?: number }[] = [];
  topConsumersDataGJ: { name: string; value: number }[] = [];
  listaClientes: Client[] = [];
  monthlyEnergyContent: (number | null)[] = new Array(12).fill(null);
  readonly DEFAULT_ROLLOVER_LIMIT = 99999999;

  showAdvancedKpis = false;
  tarifaPorM3: number | null = null;
  metaConsumoM3: number | null = null;
  variacaoPercentual: number | null = null;
  totalVolumeAnterior: number | null = null;
  picoConsumo: { value: number; label: string } | null = null;
  minimoConsumo: { value: number; label: string } | null = null;
  eficienciaEnergetica: number = 0;
  dataQualityScore: number = 0;
  custoEstimado: number = 0;
  percentualMeta: number | null = null;
  volumePorCliente: { name: string; value: number }[] = [];


  readonly curveSuave = curveMonotoneX;
  entradaAtiva: any[] = [];

  constructor(
    private clientService: ClientService,
    private certificadoService: CertificadoService,
    private consumptionService: ConsumptionService,
    private cdr: ChangeDetectorRef,
    private toastrService: NbToastrService,
  ) {}

  ngOnInit(): void {
    this.resetMetrics();
    this.carregarListaClientes();
  }

  carregarListaClientes(): void {
    this.clientService.findAll(0, 1000, 'firstName', 'asc', '').subscribe({
      next: (res: any) => {
        this.listaClientes = res?._embedded?.clientDTOList || res?._embedded?.clients || res?.content || [];
        this.totalClientes = this.listaClientes.length;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erro ao carregar clientes:', err)
    });
  }

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

onClienteSelecionadoChange(idsSelecionados: (number | string)[] | number | string | null): void {
    // Garantir que trabalhamos sempre com um array
    let ids: (number | string)[] = Array.isArray(idsSelecionados)
      ? idsSelecionados
      : (idsSelecionados !== null && idsSelecionados !== undefined ? [idsSelecionados] : []);

    // Se nenhum item foi selecionado, fallback automático para 'ALL'
    if (ids.length === 0) {
      this.selectedClientIds = ['ALL'];
    } else {
      const tinhaAllAntes = this.selectedClientIds.includes('ALL');
      const temAllAgora = ids.includes('ALL');

      // CASO 1: O utilizador acabou de clicar em 'ALL' (não estava antes, está agora)
      // -> limpa tudo e deixa só 'ALL'
      if (temAllAgora && !tinhaAllAntes) {
        this.selectedClientIds = ['ALL'];
      }
      // CASO 2: 'ALL' já estava selecionado e o utilizador adicionou um cliente específico
      // -> remove 'ALL' e mantém apenas os específicos
      else if (temAllAgora && tinhaAllAntes && ids.length > 1) {
        this.selectedClientIds = ids.filter(id => id !== 'ALL');
      }
      // CASO 3: 'ALL' está presente e é o único (já estava e continua só)
      else if (temAllAgora && ids.length === 1) {
        this.selectedClientIds = ['ALL'];
      }
      // CASO 4: Nenhum 'ALL' selecionado - apenas clientes específicos
      else {
        this.selectedClientIds = ids;
      }
    }

    // Disparar o recarregamento dos dados se os filtros estiverem completos
    if (this.isFiltrosCompletos()) {
      this.recarregarDadosDashboard();
    } else {
      this.resetMetrics();
    }
    
    this.cdr.markForCheck();
  }

  private getClientIdsSelecionados(): number[] {
    return this.selectedClientIds
      .filter(id => id !== 'ALL')
      .map(id => Number(id))
      .filter(id => !isNaN(id));
  }

  onEnergyContentChange(): void {
    this.recalcularEnergiaComNovoEnergyContent();
  }

  onTarifaChange(): void {
    this.recalcularKpisDerivados();
    this.cdr.markForCheck();
  }

  onMetaChange(): void {
    this.recalcularKpisDerivados();
    this.cdr.markForCheck();
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

    this.selectedClientIds = [cliente.id];
    this.onClienteSelecionadoChange(this.selectedClientIds);
    this.toastrService.info(`A filtrar por ${cliente.firstName}`, 'Cliente selecionado', { duration: 2500 });
  }

  get referenciasM3(): { name: string; value: number }[] {
    return this.mediaConsumoDiarioM3 > 0
      ? [{ name: 'Média', value: Number(this.mediaConsumoDiarioM3.toFixed(2)) }]
      : [];
  }

  get referenciasGJ(): { name: string; value: number }[] {
    return this.mediaConsumoDiarioGJ > 0
      ? [{ name: 'Média', value: Number(this.mediaConsumoDiarioGJ.toFixed(2)) }]
      : [];
  }

isFiltrosCompletos(): boolean {
    if (!this.selectedClientIds || this.selectedClientIds.length === 0 || !this.viewMode) return false;

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
      default:
        return false;
    }
  }

recarregarDadosDashboard(): void {
    if (!this.selectedClientIds || this.selectedClientIds.length === 0 || !this.isFiltrosCompletos()) {
      this.resetMetrics();
      return;
    }

    const isAll = this.isAllClientsSelected;
    const clientIdsNumericos = this.getClientIdsSelecionados();

    // Se 'ALL' estiver selecionado, passa undefined (para buscar todas as estações)
    const clientIdsParam: number[] | undefined = (isAll || clientIdsNumericos.length === 0)
      ? undefined
      : clientIdsNumericos;

    this.spinnerVisible = true;
    this.cdr.markForCheck();

// COMPARAÇÃO MENSAL
if (this.viewMode === 'MONTHCOMPARATION') {
      if (this.selectedYear === null || this.selectedMonth === null || this.selectedYear2 === null || this.selectedMonth2 === null) {
        return;
      }

      const start1 = this.formatDateTimeToIso(new Date(Number(this.selectedYear), Number(this.selectedMonth), 1, 0, 0, 0));
      const end1 = this.formatDateTimeToIso(new Date(Number(this.selectedYear), Number(this.selectedMonth) + 1, 0, 23, 59, 59));
      
      const start2 = this.formatDateTimeToIso(new Date(Number(this.selectedYear2), Number(this.selectedMonth2), 1, 0, 0, 0));
      const end2 = this.formatDateTimeToIso(new Date(Number(this.selectedYear2), Number(this.selectedMonth2) + 1, 0, 23, 59, 59));

      forkJoin({
        p1: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
          clientIds: clientIdsParam, startDate: start1, endDate: end1
        }),
        p2: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
          clientIds: clientIdsParam, startDate: start2, endDate: end2
        })
      })
      .pipe(finalize(() => {
        this.spinnerVisible = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          // Passa o objeto completo 'res.p1' e 'res.p2' para tratamento seguro
          this.processarComparacaoMensal(res.p1, res.p2);
        },
        error: (err) => {
          console.error('Erro ao comparar meses:', err);
          this.resetMetrics();
        }
      });
      return;
    }

    // COMPARAÇÃO ANUAL
    if (this.viewMode === 'YEARCOMPARATION') {
      const start1 = this.formatDateTimeToIso(new Date(this.selectedYear!, 0, 1, 0, 0, 0));
      const end1 = this.formatDateTimeToIso(new Date(this.selectedYear!, 11, 31, 23, 59, 59));
      const start2 = this.formatDateTimeToIso(new Date(this.selectedYear2!, 0, 1, 0, 0, 0));
      const end2 = this.formatDateTimeToIso(new Date(this.selectedYear2!, 11, 31, 23, 59, 59));

      forkJoin({
        p1: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
          clientIds: clientIdsParam, startDate: start1, endDate: end1
        }),
        p2: this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
          clientIds: clientIdsParam, startDate: start2, endDate: end2
        })
      })
      .pipe(finalize(() => {
        this.spinnerVisible = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          const c1 = res.p1?._embedded?.consumptionDTOList || res.p1?.content || [];
          const c2 = res.p2?._embedded?.consumptionDTOList || res.p2?.content || [];
          this.processarComparacaoAnual(c1, c2);
        },
        error: (err) => {
          console.error('Erro ao comparar anos:', err);
          this.resetMetrics();
        }
      });
      return;
    }

    // MODOS INDIVIDUAIS (MONTHLY, YEARLY, RANGE)
    let startIso: string | undefined;
    let endIso: string | undefined;

    if (this.viewMode === 'MONTHLY' && this.selectedMonth !== null && this.selectedYear !== null) {
      const start = new Date(this.selectedYear, this.selectedMonth, 1, 0, 0, 0);
      const ultimoDia = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
      const end = new Date(this.selectedYear, this.selectedMonth, ultimoDia, 23, 59, 59);
      startIso = this.formatDateTimeToIso(start);
      endIso = this.formatDateTimeToIso(end);
    } else if (this.viewMode === 'YEARLY' && this.selectedYear !== null) {
      startIso = this.formatDateTimeToIso(new Date(this.selectedYear, 0, 1, 0, 0, 0));
      endIso = this.formatDateTimeToIso(new Date(this.selectedYear, 11, 31, 23, 59, 59));
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
    .pipe(finalize(() => {
      this.spinnerVisible = false;
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (res: any) => {
        const consumptions = res?._embedded?.consumptionDTOList || res?._embedded?.consumptions || res?.content || [];
        this.processarDadosConsumo(consumptions);
      },
      error: (err) => {
        console.error('Erro ao carregar consumos:', err);
        this.resetMetrics();
      }
    });
  }
private processarDadosConsumo(consumptions: any[]): void {
  if (!Array.isArray(consumptions) || consumptions.length === 0) {
    this.resetMetrics();
    return;
  }

  const consumptionsOrdenados = [...consumptions].sort((a, b) => {
    return new Date(a.consumptionDate).getTime() - new Date(b.consumptionDate).getTime();
  });

  // Mapa: nomeCliente -> (dateKey -> volume)
  const perClientChartMap = new Map<string, Map<string, number>>();
  const previousReadingMap = new Map<number, number>();
  const clientTotalVolumeMap = new Map<string, number>();

  const len = consumptionsOrdenados.length;
  for (let i = 0; i < len; i++) {
    const c = consumptionsOrdenados[i];
    if (!c) continue;

    if (i === 0 && (c.energyContent || c.energy_content) && !this.energyContentMjSm3) {
      this.energyContentMjSm3 = Number(c.energyContent || c.energy_content);
    }

    const clientIdNum = Number(c.clientId ?? c.client?.id ?? c.client_id ?? 0);
    const rawReading = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);
    const cliente = this.listaClientes.find(cli => Number(cli.id) === clientIdNum);
    const clientName = c.client?.firstName || cliente?.firstName || `Cliente #${clientIdNum}`;

    let deltaVolume = 0;

    if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
      deltaVolume = Number(c.deltaVolume);
    } else {
      if (!previousReadingMap.has(clientIdNum)) {
        previousReadingMap.set(clientIdNum, rawReading);
        if (!clientTotalVolumeMap.has(clientName)) clientTotalVolumeMap.set(clientName, 0);
        continue;
      }

      const prevReading = previousReadingMap.get(clientIdNum)!;
      deltaVolume = this.calcularDeltaLeitura(
        rawReading,
        prevReading,
        c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT
      );
    }

    previousReadingMap.set(clientIdNum, rawReading);
    clientTotalVolumeMap.set(clientName, (clientTotalVolumeMap.get(clientName) || 0) + deltaVolume);

    let dateKey = 'S/D';
    if (c.consumptionDate) {
      const dateVal = new Date(c.consumptionDate);
      if (!isNaN(dateVal.getTime())) {
        dateKey = (this.viewMode === 'YEARLY')
          ? this.meses[dateVal.getMonth()]
          : `${String(dateVal.getDate()).padStart(2, '0')}/${String(dateVal.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    // Acumular por cliente
    if (!perClientChartMap.has(clientName)) {
      perClientChartMap.set(clientName, new Map<string, number>());
    }
    const clientMap = perClientChartMap.get(clientName)!;
    clientMap.set(dateKey, (clientMap.get(dateKey) || 0) + deltaVolume);
  }

  // Totais
  let totalVbM3 = 0;
  const topConsumers: { name: string; value: number; percent?: number }[] = [];

  clientTotalVolumeMap.forEach((vbCliente, clientName) => {
    totalVbM3 += vbCliente;
    topConsumers.push({ name: clientName, value: vbCliente });
  });

  // Logo após: clientTotalVolumeMap.forEach(...) que preenche topConsumers
this.volumePorCliente = Array.from(clientTotalVolumeMap.entries())
  .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
  .sort((a, b) => b.value - a.value);

  this.totalVolumeConsumido = Number(totalVbM3.toFixed(2));
  this.totalRegistos = len;

  const totalDiasMes = (this.selectedYear && this.selectedMonth !== null)
    ? new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate()
    : (perClientChartMap.size > 0 ? Math.max(...Array.from(perClientChartMap.values()).map(m => m.size)) : 1);

  this.mediaConsumoDiarioM3 = this.totalVolumeConsumido / (totalDiasMes || 1);

  // Construir séries
  this.areaChartDataM3 = this.construirSeriesM3(perClientChartMap);

  // TOP consumers (percentagens)
  for (let i = 0; i < topConsumers.length; i++) {
    topConsumers[i].percent = this.totalVolumeConsumido > 0
      ? (topConsumers[i].value / this.totalVolumeConsumido) * 100
      : 0;
  }
  topConsumers.sort((a, b) => b.value - a.value);
  this.topConsumersData = topConsumers.slice(0, 5);

  // Pico / mínimo — usar todas as séries
  const datasetsParaPico = this.areaChartDataM3.map(ds => ({
    nome: this.areaChartDataM3.length > 1 ? ds.name : '',
    pontos: ds.series
  }));
  const { pico, minimo } = this.encontrarPicoEMinimo(datasetsParaPico);
  this.picoConsumo = pico;
  this.minimoConsumo = minimo;

  const periodosEsperados = this.calcularPeriodosEsperados();
  const maiorMapSize = perClientChartMap.size > 0
    ? Math.max(...Array.from(perClientChartMap.values()).map(m => m.size))
    : 0;
  this.dataQualityScore = periodosEsperados > 0
    ? Math.min(100, Number(((maiorMapSize / periodosEsperados) * 100).toFixed(0)))
    : 0;

  this.recalcularEnergiaComNovoEnergyContent();
}

/**
 * Constrói as séries do gráfico de evolução.
 * - Se for apenas 1 cliente (ou ALL agregado num único cliente), devolve 1 série.
 * - Se forem múltiplos clientes, devolve 1 série por cliente,
 *   com todas as datas alinhadas (union) para que o gráfico fique consistente.
 */
private construirSeriesM3(perClientChartMap: Map<string, Map<string, number>>): any[] {
  const nomesClientes = Array.from(perClientChartMap.keys());

  // Caso 1: apenas 1 cliente -> série única (mantém label original)
  if (nomesClientes.length <= 1) {
    const unico = nomesClientes[0];
    const mapa = unico ? perClientChartMap.get(unico)! : new Map<string, number>();
    const series = Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      // Ordenar por data (para MONTHLY/RANGE) ou por mês (YEARLY)
      .sort((a, b) => this.compararLabelsPeriodo(a.name, b.name));
    return [{ name: 'Consumo Real (m³)', series }];
  }

  // Caso 2: múltiplos clientes -> 1 série por cliente
  // Calcular a union de todas as datas, ordenada
  const todasDatas = new Set<string>();
  perClientChartMap.forEach(mapa => mapa.forEach((_, data) => todasDatas.add(data)));
  const datasOrdenadas = Array.from(todasDatas)
    .sort((a, b) => this.compararLabelsPeriodo(a, b));

  return nomesClientes.map(nomeCliente => {
    const mapa = perClientChartMap.get(nomeCliente)!;
    const series = datasOrdenadas.map(data => ({
      name: data,
      value: Number((mapa.get(data) || 0).toFixed(2))
    }));
    return { name: nomeCliente, series };
  });
}

/**
 * Compara duas labels de período para ordenação.
 * Suporta formatos: "dd/MM", "Janeiro"..."Dezembro", "Dia NN", "S/D".
 */
private compararLabelsPeriodo(a: string, b: string): number {
  // Meses
  const idxA = this.meses.indexOf(a);
  const idxB = this.meses.indexOf(b);
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;

  // Dia NN
  const diaMatchA = a.match(/Dia (\d+)/);
  const diaMatchB = b.match(/Dia (\d+)/);
  if (diaMatchA && diaMatchB) {
    return Number(diaMatchA[1]) - Number(diaMatchB[1]);
  }

  // dd/MM
  const ddmmA = a.match(/^(\d{2})\/(\d{2})$/);
  const ddmmB = b.match(/^(\d{2})\/(\d{2})$/);
  if (ddmmA && ddmmB) {
    const da = Number(ddmmA[1]), ma = Number(ddmmA[2]);
    const db = Number(ddmmB[1]), mb = Number(ddmmB[2]);
    if (ma !== mb) return ma - mb;
    return da - db;
  }

  // Fallback alfabético
  return a.localeCompare(b);
}

  private processarComparacaoMensal(consumptions1: any[], consumptions2: any[]): void {
    const labelPeriodo1 = `${this.meses[this.selectedMonth!]} / ${this.selectedYear}`;
    const labelPeriodo2 = `${this.meses[this.selectedMonth2!]} / ${this.selectedYear2}`;

    const series1 = this.extrairSeriesPorDiaDoMes(consumptions1);
    const series2 = this.extrairSeriesPorDiaDoMes(consumptions2);

    const vol1 = series1.reduce((acc, curr) => acc + curr.value, 0);
    const vol2 = series2.reduce((acc, curr) => acc + curr.value, 0);

    this.totalVolumeConsumido = Number((vol1 + vol2).toFixed(2));
    this.totalRegistos = consumptions1.length + consumptions2.length;

    this.areaChartDataM3 = [
      { name: labelPeriodo1, series: series1 },
      { name: labelPeriodo2, series: series2 }
    ];

    const dadosSuficientes = consumptions1.length > 0;
    this.totalVolumeAnterior = dadosSuficientes ? Number(vol1.toFixed(2)) : null;
    this.variacaoPercentual = (dadosSuficientes && vol1 > 0)
      ? Number((((vol2 - vol1) / vol1) * 100).toFixed(1))
      : null;

    const { pico, minimo } = this.encontrarPicoEMinimo([
      { nome: labelPeriodo1, pontos: series1 },
      { nome: labelPeriodo2, pontos: series2 }
    ]);
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    this.recalcularEnergiaComNovoEnergyContent();
  }

  private processarComparacaoAnual(consumptions1: any[], consumptions2: any[]): void {
    const labelAno1 = `Ano ${this.selectedYear}`;
    const labelAno2 = `Ano ${this.selectedYear2}`;

    const series1 = this.extrairSeriesPorMesDoAno(consumptions1);
    const series2 = this.extrairSeriesPorMesDoAno(consumptions2);

    const vol1 = series1.reduce((acc, curr) => acc + curr.value, 0);
    const vol2 = series2.reduce((acc, curr) => acc + curr.value, 0);

    this.totalVolumeConsumido = Number((vol1 + vol2).toFixed(2));
    this.totalRegistos = consumptions1.length + consumptions2.length;

    this.areaChartDataM3 = [
      { name: labelAno1, series: series1 },
      { name: labelAno2, series: series2 }
    ];

    const dadosSuficientes = consumptions1.length > 0;
    this.totalVolumeAnterior = dadosSuficientes ? Number(vol1.toFixed(2)) : null;
    this.variacaoPercentual = (dadosSuficientes && vol1 > 0)
      ? Number((((vol2 - vol1) / vol1) * 100).toFixed(1))
      : null;

    const { pico, minimo } = this.encontrarPicoEMinimo([
      { nome: labelAno1, pontos: series1 },
      { nome: labelAno2, pontos: series2 }
    ]);
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    this.recalcularEnergiaComNovoEnergyContent();
  }

  private extrairSeriesPorDiaDoMes(consumptions: any[]): { name: string; value: number }[] {
    if (!Array.isArray(consumptions) || consumptions.length === 0) return [];

    const consumptionsOrdenados = [...consumptions].sort((a, b) => {
      return new Date(a.consumptionDate).getTime() - new Date(b.consumptionDate).getTime();
    });

    const chartMap = new Map<string, number>();
    const previousReadingMap = new Map<number, number>();

    const len = consumptionsOrdenados.length;
    for (let i = 0; i < len; i++) {
      const c = consumptionsOrdenados[i];
      if (!c) continue;

      const clientIdNum = Number(c.clientId ?? c.client?.id ?? 0);
      const rawReading = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);

      let deltaVolume = 0;

      if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
        deltaVolume = Number(c.deltaVolume);
      } else {
        if (!previousReadingMap.has(clientIdNum)) {
          previousReadingMap.set(clientIdNum, rawReading);
          continue;
        }

        const prevReading = previousReadingMap.get(clientIdNum)!;
        deltaVolume = this.calcularDeltaLeitura(
          rawReading,
          prevReading,
          c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT
        );
      }

      previousReadingMap.set(clientIdNum, rawReading);

      if (c.consumptionDate) {
        const dateVal = new Date(c.consumptionDate);
        if (!isNaN(dateVal.getTime())) {
          const dayKey = `Dia ${String(dateVal.getDate()).padStart(2, '0')}`;
          chartMap.set(dayKey, (chartMap.get(dayKey) || 0) + deltaVolume);
        }
      }
    }

    return Array.from(chartMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  }

  private extrairSeriesPorMesDoAno(consumptions: any[]): { name: string; value: number }[] {
    if (!Array.isArray(consumptions) || consumptions.length === 0) return [];

    const consumptionsOrdenados = [...consumptions].sort((a, b) => {
      return new Date(a.consumptionDate).getTime() - new Date(b.consumptionDate).getTime();
    });

    const chartMap = new Map<string, number>();
    const previousReadingMap = new Map<number, number>();

    const len = consumptionsOrdenados.length;
    for (let i = 0; i < len; i++) {
      const c = consumptionsOrdenados[i];
      if (!c) continue;

      const clientIdNum = Number(c.clientId ?? c.client?.id ?? 0);
      const rawReading = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);

      let deltaVolume = 0;

      if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
        deltaVolume = Number(c.deltaVolume);
      } else {
        if (!previousReadingMap.has(clientIdNum)) {
          previousReadingMap.set(clientIdNum, rawReading);
          continue;
        }

        const prevReading = previousReadingMap.get(clientIdNum)!;
        deltaVolume = this.calcularDeltaLeitura(
          rawReading,
          prevReading,
          c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT
        );
      }

      previousReadingMap.set(clientIdNum, rawReading);

      if (c.consumptionDate) {
        const dateVal = new Date(c.consumptionDate);
        if (!isNaN(dateVal.getTime())) {
          const monthKey = this.meses[dateVal.getMonth()];
          chartMap.set(monthKey, (chartMap.get(monthKey) || 0) + deltaVolume);
        }
      }
    }

    return Array.from(chartMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
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

      // Preservar o nome do dataset (nome do cliente ou 'Consumo Real (m³)')
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
      
    this.cdr.markForCheck();
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
    this.monthlyEnergyContent = new Array(12).fill(null);
    this.variacaoPercentual = null;
    this.totalVolumeAnterior = null;
    this.picoConsumo = null;
    this.minimoConsumo = null;
    this.dataQualityScore = 0;
    this.eficienciaEnergetica = 0;
    this.custoEstimado = 0;
    this.percentualMeta = null;
    this.volumePorCliente = [];
    
    this.cdr.markForCheck();
  }

  private encontrarPicoEMinimo(datasets: { nome: string; pontos: { name: string; value: number }[] }[]): { pico: { value: number; label: string } | null; minimo: { value: number; label: string } | null } {
    let pico: { value: number; label: string } | null = null;
    let minimo: { value: number; label: string } | null = null;

    for (let i = 0; i < datasets.length; i++) {
      const { nome, pontos } = datasets[i];
      for (let j = 0; j < pontos.length; j++) {
        const ponto = pontos[j];
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

  formatarDataLabel(val: number): string {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString();
  }

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
      .map(id => this.listaClientes.find(c => Number(c.id) === Number(id))?.firstName)
      .filter((nome): nome is string => !!nome);

    if (nomes.length === 0) return '';
    if (nomes.length <= 3) return nomes.join(', ');
    return `${nomes.slice(0, 3).join(', ')} +${nomes.length - 3}`;
  }

  get colorSchemeM3Dynamic(): any {
  // Se temos várias séries, gerar cores distintas
  const baseCores = this.colorSchemeDonut.domain;
  const qtdSeries = this.areaChartDataM3.length;

  if (qtdSeries <= baseCores.length) return this.colorSchemeDonut;

  // Gerar mais cores via HSL
  const extras: string[] = [];
  for (let i = baseCores.length; i < qtdSeries; i++) {
    const hue = (i * 137.508) % 360; // golden angle
    extras.push(`hsl(${hue}, 65%, 55%)`);
  }
  return { domain: [...baseCores, ...extras] };
}
}