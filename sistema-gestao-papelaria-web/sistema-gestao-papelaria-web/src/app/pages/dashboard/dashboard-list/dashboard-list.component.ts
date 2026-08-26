import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ClientService } from '@app/services/client.service';
import { ConsumptionService } from '@app/services/consumption.service';
import { Client } from '@app/shared/models/client';
import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

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

@Component({
  selector: 'app-dashboard-list',
  templateUrl: './dashboard-list.component.html',
  styleUrls: ['./dashboard-list.component.scss'],
  standalone: true,
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

  // Constante da fórmula do quadro-negro (1.05491)
  readonly CONSTANTE_ENERGIA_STD = 1.05491;

  /**
   * Energy Content [MJ/Sm³]
   * Valor inserido/editado pelo utilizador no dashboard (ex: 41.534).
   */
  energyContentMjSm3: number | null = null; 

  totalRegistos: number = 0;
  
  // Dados dos Gráficos
  areaChartDataM3: any[] = [{ name: 'Consumo Real (m³)', series: [] }];
  areaChartDataGJ: any[] = [{ name: 'Energia Real (GJ)', series: [] }];
  
  // Filtros
  selectedClientId: number | string | null = null;  
viewMode: 'MONTHLY' | 'YEARLY' | 'RANGE' | 'MONTHCOMPARATION' | 'YEARCOMPARATION' | null = null;
selectedMonth2: number | null = null;
selectedYear2: number | null = null;  
startDate: Date | null = null;
  endDate: Date | null = null;
  selectedMonth: number | null = null; 
  selectedYear: number | null = null; 

  meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  anos = [2024, 2025, 2026];

  // Métricas Calculadas (Conforme Fórmulas do Quadro-Negro)
  totalVolumeConsumido: number = 0;   // Vb [Sm³]
  energyStd: number = 0;              // Energy std [Sm³/GJ]
  totalEnergiaConsumidaGJ: number = 0;// Energy [GJ]
  
  mediaConsumoDiarioM3: number = 0;   // m³/dia
  mediaConsumoDiarioGJ: number = 0;   // GJ/dia
  totalClientes: number = 0;

  // Esquemas de Cores
  colorScheme: any = { 
    domain: ['#3366ff', '#00d68f', '#ffaa00', '#0095ff', '#a16eff'] 
  };

  colorSchemeGJ: any = { 
    domain: ['#ffaa00', '#ff3d71', '#3366ff', '#00d68f', '#a16eff'] 
  };

  colorSchemeDonut: any = { 
    domain: ['#00d68f', '#3366ff', '#ffaa00', '#32dbf0', '#ff3d71'] 
  };

  topConsumersData: { name: string; value: number; percent?: number }[] = [];
  topConsumersDataGJ: { name: string; value: number }[] = [];
  listaClientes: Client[] = [];
  monthlyEnergyContent: (number | null)[] = new Array(12).fill(null);
  readonly DEFAULT_ROLLOVER_LIMIT = 99999999;

  constructor(
    private clientService: ClientService,
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
        this.listaClientes = res?._embedded?.clientDTOList 
                          || res?._embedded?.clients 
                          || res?.content 
                          || [];
        this.totalClientes = this.listaClientes.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar clientes:', err)
    });
  }

  onViewModeChange(): void {
    if (!this.viewMode) {
      return;
    }
this.resetMetrics();
  this.selectedMonth = null;
  this.selectedYear = null;
  this.selectedMonth2 = null;
  this.selectedYear2 = null;
  this.startDate = null;
  this.endDate = null;
  this.monthlyEnergyContent = new Array(12).fill(null);
  }

  onClienteSelecionadoChange(clienteId: number | string | null): void {
    this.selectedClientId = clienteId;
    if (this.isFiltrosCompletos()) {
      this.recarregarDadosDashboard();
    } else {
      this.resetMetrics();
    }
  }

  onEnergyContentChange(): void {
    this.recalcularEnergiaComNovoEnergyContent();
  }

  isFiltrosCompletos(): boolean {
    if (this.selectedClientId === null || this.selectedClientId === undefined || this.selectedClientId === '') {
      return false;
    }

    if (!this.viewMode) {
      return false;
    }

    if (this.viewMode === 'MONTHLY') {
      return this.selectedMonth !== null && this.selectedYear !== null;
    }

    if (this.viewMode === 'MONTHCOMPARATION') {
    return this.selectedMonth !== null && this.selectedYear !== null &&
           this.selectedMonth2 !== null && this.selectedYear2 !== null;
  }

    if (this.viewMode === 'YEARLY') {
      return this.selectedYear !== null;
    }

    if (this.viewMode === 'RANGE') {
      return !!this.startDate && !!this.endDate;
    }

    return false;
  }

  private processarComparacaoMensal(consumptions1: any[], consumptions2: any[]): void {
  const labelPeriodo1 = `${this.meses[this.selectedMonth!]} / ${this.selectedYear}`;
  const labelPeriodo2 = `${this.meses[this.selectedMonth2!]} / ${this.selectedYear2}`;

  const series1 = this.extrairSeriesPorDiaDoMes(consumptions1);
  const series2 = this.extrairSeriesPorDiaDoMes(consumptions2);

  // Totais e Métricas acumuladas dos dois períodos
  const vol1 = series1.reduce((acc, curr) => acc + curr.value, 0);
  const vol2 = series2.reduce((acc, curr) => acc + curr.value, 0);

  this.totalVolumeConsumido = Number((vol1 + vol2).toFixed(2));
  this.totalRegistos = consumptions1.length + consumptions2.length;

  // Montagem do gráfico de m³ com duas linhas
  this.areaChartDataM3 = [
    { name: labelPeriodo1, series: series1 },
    { name: labelPeriodo2, series: series2 }
  ];

  this.recalcularEnergiaComNovoEnergyContent();
}

private extrairSeriesPorDiaDoMes(consumptions: any[]): { name: string; value: number }[] {
  if (!Array.isArray(consumptions) || consumptions.length === 0) {
    return [];
  }

  const sorted = [...consumptions].sort((a, b) => {
    return new Date(a.consumptionDate || 0).getTime() - new Date(b.consumptionDate || 0).getTime();
  });

  const chartMap = new Map<string, number>();
  const previousReadingMap = new Map<number, number>();

  sorted.forEach((c) => {
    if (!c) return;
    const clientIdNum = Number(c.clientId ?? c.client?.id ?? 0);
    const rawReading = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);

    if (!previousReadingMap.has(clientIdNum)) {
      previousReadingMap.set(clientIdNum, rawReading);
      return;
    }

    const prevReading = previousReadingMap.get(clientIdNum)!;
    let deltaVolume = 0;

    if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
      deltaVolume = Number(c.deltaVolume);
    } else {
      const customRollover = c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT;
      deltaVolume = this.calcularDeltaLeitura(rawReading, prevReading, customRollover);
    }

    previousReadingMap.set(clientIdNum, rawReading);

    if (c.consumptionDate) {
      const dateVal = new Date(c.consumptionDate);
      if (!isNaN(dateVal.getTime())) {
        // Usa o formato "Dia XX" para sobrepor corretamente no eixo X (Dia 01, Dia 02, ..., Dia 31)
        const dayKey = `Dia ${String(dateVal.getDate()).padStart(2, '0')}`;
        chartMap.set(dayKey, (chartMap.get(dayKey) || 0) + deltaVolume);
      }
    }
  });

  return Array.from(chartMap.entries()).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }));
}

  recarregarDadosDashboard(): void {
    if (!this.selectedClientId) {
      this.resetMetrics();
      this.toastrService.warning(
        'Selecione um cliente específico ou "Todos os Clientes" para filtrar.',
        'Selecione o Cliente',
        { duration: 5000 }
      );
      return;
    }

    if (!this.isFiltrosCompletos()) {
      this.resetMetrics();
      return;
    }

    const clientIdParam = (this.selectedClientId === 'ALL' || !this.selectedClientId)
      ? undefined 
      : Number(this.selectedClientId);

      this.spinnerVisible = true;

  if (this.viewMode === 'MONTHCOMPARATION') {
    const start1 = new Date(this.selectedYear!, this.selectedMonth!, 1, 8, 0, 0);
    const end1 = new Date(this.selectedYear!, this.selectedMonth! + 1, 1, 8, 0, 0);

    const start2 = new Date(this.selectedYear2!, this.selectedMonth2!, 1, 8, 0, 0);
    const end2 = new Date(this.selectedYear2!, this.selectedMonth2! + 1, 1, 8, 0, 0);

    const req1 = this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
      clientId: clientIdParam,
      startDate: this.formatDateTimeToIso(start1),
      endDate: this.formatDateTimeToIso(end1)
    }).pipe(catchError(() => of([])));

    const req2 = this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
      clientId: clientIdParam,
      startDate: this.formatDateTimeToIso(start2),
      endDate: this.formatDateTimeToIso(end2)
    }).pipe(catchError(() => of([])));

    forkJoin([req1, req2])
      .pipe(finalize(() => {
        this.spinnerVisible = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: ([res1, res2]: [any, any]) => {
          const list1 = res1?._embedded?.consumptionDTOList || res1?._embedded?.consumptions || res1?.content || [];
          const list2 = res2?._embedded?.consumptionDTOList || res2?._embedded?.consumptions || res2?.content || [];
          this.processarComparacaoMensal(list1, list2);
        },
        error: (err) => {
          console.error('Erro ao comparar consumos:', err);
          this.resetMetrics();
        }
      });

    return;
  }

    let startIso: string | undefined;
    let endIso: string | undefined;

    if (this.viewMode === 'MONTHLY' && this.selectedMonth !== null && this.selectedYear !== null) {
      // Regra MGC do Quadro-Negro:
      // Vb = Cumulative Vb @ 8:00, 1st following month - Cumulative Vb @ 8:00, 1st previous month
      const start = new Date(this.selectedYear, this.selectedMonth, 1, 8, 0, 0);
      const end = new Date(this.selectedYear, this.selectedMonth + 1, 1, 8, 0, 0);

      startIso = this.formatDateTimeToIso(start);
      endIso = this.formatDateTimeToIso(end);
    } 
    else if (this.viewMode === 'YEARLY' && this.selectedYear !== null) {
      const start = new Date(this.selectedYear, 0, 1, 8, 0, 0);
      const end = new Date(this.selectedYear + 1, 0, 1, 8, 0, 0);
      startIso = this.formatDateTimeToIso(start);
      endIso = this.formatDateTimeToIso(end);
    } 
    else if (this.viewMode === 'RANGE' && this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59);
      startIso = this.formatDateTimeToIso(start);
      endIso = this.formatDateTimeToIso(end);
    }

    this.spinnerVisible = true;

    this.consumptionService.filterConsumptions(0, 10000, 'consumptionDate', 'asc', {
      clientId: clientIdParam,
      startDate: startIso,
      endDate: endIso
    })
    .pipe(
      finalize(() => {
        this.spinnerVisible = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res: any) => {
        const consumptions = res?._embedded?.consumptionDTOList 
                          || res?._embedded?.consumptions 
                          || res?.content 
                          || [];
        
        this.processarDadosConsumo(consumptions);
      },
      error: (err) => {
        console.error('Erro ao carregar consumos:', err);
        this.resetMetrics();
      }
    });
  }

  private formatDateTimeToIso(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private calcularDeltaLeitura(
    leituraAtual: number,
    leituraAnterior: number,
    tetoRollover: number = this.DEFAULT_ROLLOVER_LIMIT
  ): number {
    if (isNaN(leituraAtual) || isNaN(leituraAnterior)) {
      return 0;
    }

    if (leituraAtual >= leituraAnterior) {
      return leituraAtual - leituraAnterior;
    }

    const deltaRestanteAteLimite = tetoRollover - leituraAnterior;
    if (deltaRestanteAteLimite < 0) {
      return 0;
    }

    return deltaRestanteAteLimite + leituraAtual;
  }

  private processarDadosConsumo(consumptions: any[]): void {
    if (!Array.isArray(consumptions) || consumptions.length === 0) {
      this.resetMetrics();
      return;
    }

    // Ordenação cronológica rigorosa
    const sortedConsumptions = [...consumptions].sort((a, b) => {
      const dateA = new Date(a.consumptionDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.consumptionDate || b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    const firstWithContent = sortedConsumptions.find(c => c.energyContent || c.energy_content);
    if (firstWithContent && !this.energyContentMjSm3) {
      this.energyContentMjSm3 = Number(firstWithContent.energyContent || firstWithContent.energy_content);
    }

    const chartMapM3 = new Map<string, number>();
    const previousReadingMap = new Map<number, number>();
    const clientTotalVolumeMap = new Map<string, number>();

    sortedConsumptions.forEach((c) => {
      if (!c) return;

      const clientIdNum = Number(c.clientId ?? c.client?.id ?? c.client_id ?? 0);
      const rawReading = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);

      const cliente = this.listaClientes.find(cli => Number(cli.id) === clientIdNum);
      const clientName = c.client?.firstName || cliente?.firstName || `Cliente #${clientIdNum}`;

      if (!previousReadingMap.has(clientIdNum)) {
        previousReadingMap.set(clientIdNum, rawReading);
        if (!clientTotalVolumeMap.has(clientName)) {
          clientTotalVolumeMap.set(clientName, 0);
        }
        return; // Establece a linha de base inicial
      }

      const prevReading = previousReadingMap.get(clientIdNum)!;
      let deltaVolume = 0;

      if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
        deltaVolume = Number(c.deltaVolume);
      } else {
        const customRollover = c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT;
        deltaVolume = this.calcularDeltaLeitura(rawReading, prevReading, customRollover);
      }

      previousReadingMap.set(clientIdNum, rawReading);

      clientTotalVolumeMap.set(
        clientName,
        (clientTotalVolumeMap.get(clientName) || 0) + deltaVolume
      );

      let dateKey = 'S/D';
      if (c.consumptionDate) {
        const dateVal = new Date(c.consumptionDate);
        if (!isNaN(dateVal.getTime())) {
          if (this.viewMode === 'YEARLY') {
            dateKey = this.meses[dateVal.getMonth()];
          } else {
            dateKey = dateVal.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
          }
        }
      }

      chartMapM3.set(dateKey, (chartMapM3.get(dateKey) || 0) + deltaVolume);
    });

    let totalVbM3 = 0;
    const clientMapM3 = new Map<string, number>();

    clientTotalVolumeMap.forEach((vbCliente, clientName) => {
      totalVbM3 += vbCliente;
      clientMapM3.set(clientName, vbCliente);
    });

    this.totalVolumeConsumido = totalVbM3;
    this.totalRegistos = sortedConsumptions.length;
    
    const totalDiasOuMeses = chartMapM3.size || 1;
    this.mediaConsumoDiarioM3 = this.totalVolumeConsumido / totalDiasOuMeses;

    const seriesM3 = Array.from(chartMapM3.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));

    this.areaChartDataM3 = [
      {
        name: 'Consumo Real (m³)',
        series: seriesM3
      }
    ];

    this.topConsumersData = Array.from(clientMapM3.entries())
      .map(([name, value]) => ({
        name,
        value,
        percent: this.totalVolumeConsumido > 0 ? (value / this.totalVolumeConsumido) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    this.recalcularEnergiaComNovoEnergyContent();
  }

  /**
   * Recalcula a energia aplicando as 3 fórmulas do quadro-negro:
   * 1. Energy std = (1.05491 / Energy Content) * 1000
   * 2. Energy [GJ] = Total Corrected Volume (Vb) / Energy std
   */
  private recalcularEnergiaComNovoEnergyContent(): void {
    if (this.areaChartDataM3[0]?.series?.length > 0) {
      let totalEnergiaAcumuladaGJ = 0;

      const novasSeriesGJ = this.areaChartDataM3[0].series.map((item: any) => {
        let contentParaCalculo = Number(this.energyContentMjSm3);

        if (this.viewMode === 'YEARLY') {
          const indexMes = this.meses.indexOf(item.name);
          if (indexMes !== -1 && Number(this.monthlyEnergyContent[indexMes]) > 0) {
            contentParaCalculo = Number(this.monthlyEnergyContent[indexMes]);
          }
        }

        // FÓRMULA 1 (Quadro): Energy std [Sm³/GJ] = (1.05491 / Energy Content) * 1000
        const energyStdItem = contentParaCalculo > 0 
          ? (this.CONSTANTE_ENERGIA_STD / contentParaCalculo) * 1000 
          : 0;

        // FÓRMULA 2 (Quadro): Energy [GJ] = Total Corrected Volume (Vb) / Energy std
        const energiaGJ = energyStdItem > 0 
          ? Number((item.value / energyStdItem).toFixed(2)) 
          : 0;

        totalEnergiaAcumuladaGJ += energiaGJ;

        return {
          name: item.name,
          value: energiaGJ
        };
      });

      // Atualiza o Energy std global visível nas métricas
      const globalContent = Number(this.energyContentMjSm3);
      this.energyStd = globalContent > 0 
        ? Number(((this.CONSTANTE_ENERGIA_STD / globalContent) * 1000).toFixed(3)) 
        : 0;

      this.totalEnergiaConsumidaGJ = Number(totalEnergiaAcumuladaGJ.toFixed(2));

      this.areaChartDataGJ = [
        {
          name: 'Energia (GJ)',
          series: novasSeriesGJ
        }
      ];
    } else {
      this.energyStd = 0;
      this.totalEnergiaConsumidaGJ = 0;
      this.areaChartDataGJ = [{ name: 'Energia (GJ)', series: [] }];
    }

    const totalUnidades = this.areaChartDataM3[0]?.series?.length || 1;
    this.mediaConsumoDiarioGJ = this.totalEnergiaConsumidaGJ / totalUnidades;

    this.cdr.detectChanges();
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
  }

  emitirCertificado(): void {
    if (this.totalRegistos === 0 || this.totalVolumeConsumido === 0) {
    this.toastrService.warning(
      'Não é possível emitir certificado para os filtros inseridos pois não existem dados de consumo registrados para o período.',
      'Aviso',
      { duration: 6000 }
    );
    return;
  }
    const parametros = {
      clientId: (this.selectedClientId === 'ALL' || !this.selectedClientId) ? null : Number(this.selectedClientId),
      viewMode: this.viewMode,
      selectedMonth: this.selectedMonth,
      selectedYear: this.selectedYear,
      startDate: this.startDate,
      endDate: this.endDate,
      energyContentMjSm3: this.energyContentMjSm3
    };

    console.log('A emitir certificado JasperReports com os parâmetros:', parametros);
  }

  formatarDataLabel(val: number): string {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return val.toLocaleString();
  }

  get isFiltrosValidosForCertificado(): boolean {

    if (this.isAllClientsSelected) {
    return false;
  }

    if (!this.viewMode) {
      return false;
    }

    if (this.viewMode === 'MONTHLY') {
      return this.selectedMonth !== null && this.selectedYear !== null;
    } 

    if (this.viewMode === 'YEARLY') {
      return this.selectedYear !== null;
    } 

    if (this.viewMode === 'RANGE') {
      return !!this.startDate && !!this.endDate;
    }

    return false;
  }

  get isAllClientsSelected(): boolean {
    return this.selectedClientId === 'ALL' || !this.selectedClientId;
  }

  get nomeClienteSelecionado(): string {
    if (this.isAllClientsSelected) {
      return 'Todos os Clientes';
    }
    const cli = this.listaClientes.find(c => Number(c.id) === Number(this.selectedClientId));
    return cli ? cli.firstName : '';
  }
}