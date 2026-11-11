import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { ClientService } from '@app/services/client.service';
import { ConsumptionService } from '@app/services/consumption.service';
import { Client } from '@app/shared/models/client';
import { finalize, debounceTime } from 'rxjs/operators';
import { forkJoin, Observable, Subject, Subscription } from 'rxjs';
import { curveMonotoneX } from 'd3-shape';
import { NbToastrService } from '@nebular/theme';


import { CertificadoDashboardDTO, CertificadoService } from '@app/services/certificado.service';

type ViewMode = 'MONTHLY' | 'YEARLY' | 'RANGE' | 'MONTHCOMPARATION' | 'YEARCOMPARATION' | 'ENTRADA_VS_SAIDA';
type PontoSerie = { name: string; value: number };
type Granularidade = 'DIA' | 'MES';
type ModoKpi = 'NORMAL' | 'COMPARACAO' | 'ENTRADA_SAIDA';

/** Intervalo em hora LOCAL (inicio 00:00:00, fim 23:59:59). */
interface Periodo { inicio: Date; fim: Date; }

/** Consumo (delta) de um registo já calculado. */
interface DeltaRegisto { clientId: number; clientName: string; data: Date; delta: number; }

interface ResultadoDeltas {
  /** Apenas deltas de leituras DENTRO do período (as anteriores servem só de referência). */
  deltas: DeltaRegisto[];
  /** Leituras em que o contador recuou sem rollover plausível (ignoradas). */
  leiturasAnomalas: number;
  /** Dias (yyyy-MM-dd) com pelo menos uma leitura, por estação. */
  diasComDados: Map<number, Set<string>>;
  nomes: Map<number, string>;
  ultimaLeitura: Date | null;
  energyContent: number | null;
}

interface LinhaKpi { label: string; value: number; value2?: number; destaque?: boolean; }

interface ResumoPeriodo { label: string; volumeM3: number; dias: number; }

/**
 * Entradas vs Saídas.
 * Erro (%) = (Entrada − Consumo) / Consumo × 100 = (Entrada / Consumo − 1) × 100
 * onde Consumo = Σ consumo das estações de saída. Calculado em m³ e em GJ.
 */
interface ResumoEntradaSaida {
  entradaM3: number; saidaM3: number; diferencaM3: number; erroM3: number | null;
  entradaGJ: number; saidaGJ: number; diferencaGJ: number; erroGJ: number | null;
  diferencaMediaM3: number;
}

@Component({
  selector: 'app-dashboard-list',
  templateUrl: './dashboard-list.component.html',
  styleUrls: ['./dashboard-list.component.scss'],
  //standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class DashboardListComponent implements OnInit, OnDestroy {
  isLoading = false;
  spinnerVisible = false;

  /** Muda para false se quiseres desligar por completo as animações dos gráficos. */
  readonly chartAnimations = true;

  readonly CONSTANTE_ENERGIA_STD = 1.05491;
  readonly DEFAULT_ROLLOVER_LIMIT = 99999999;
  readonly LIMITE_REGISTOS = 10000;
  /** Dias pedidos ANTES do início do período, só para obter a leitura de referência (ver calcularDeltas). */
  readonly DIAS_LOOKBACK = 7;
  /** Primeiro ano com dados. A lista de anos vai daqui até ao ano corrente. */
  readonly ANO_INICIAL = 2024;
  readonly MAX_ESTACOES_NO_TOP = 5;

  energyContentMjSm3: number | null = null;
  totalRegistos = 0;

  areaChartDataM3: any[] = [{ name: 'Consumo Real (m³)', series: [] }];
  areaChartDataGJ: any[] = [{ name: 'Energia Real (GJ)', series: [] }];

  selectedClientIds: (number | string)[] = ['ALL'];
  viewMode: ViewMode | null = null;
  selectedMonth2: number | null = null;
  selectedYear2: number | null = null;
  /** Datas do intervalo personalizado no formato 'yyyy-MM-dd' (string do <input type="date">). */
  startDate: string | null = null;
  endDate: string | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  /** Gerado automaticamente: ano corrente → ANO_INICIAL. */
  anos: number[] = this.gerarAnos();

  totalVolumeConsumido = 0;
  energyStd = 0;
  totalEnergiaConsumidaGJ = 0;

  mediaConsumoDiarioM3 = 0;
  mediaConsumoDiarioGJ = 0;
  totalClientes = 0;
  /** Estações abrangidas pelo filtro atual (e não as do sistema inteiro). */
  estacoesNoFiltro = 0;
  estacoesComDados = 0;
  selectedCategories: string[] = ['ALL'];

  colorSchemeDonut: any = { domain: ['#00d68f', '#3366ff', '#ffaa00', '#32dbf0', '#ff3d71'] };
  /** Donut/barras: as 5 cores + cinzento para a fatia "Outras". */
  colorSchemeTop: any = { domain: [...this.colorSchemeDonut.domain, '#94a3b8'] };
  /** Esquema usado nos gráficos de linha (estável: só muda quando muda o nº de séries). */
  colorSchemeLinhas: any = this.colorSchemeDonut;

  topConsumersData: { name: string; value: number; percent?: number }[] = [];
  topConsumersDataGJ: { name: string; value: number }[] = [];
  listaClientes: Client[] = [];
  /** Lista já filtrada por categoria (propriedade, não getter, para manter referência estável). */
  listaClientesFiltradaPorCategoria: Client[] = [];
  private clientesPorId = new Map<number, Client>();
  private clientesCarregados = false;

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

  // ----- Estado dos KPIs por modo (comparações / entradas vs saídas) -----
  linhasM3: LinhaKpi[] = [];
  linhasGJ: LinhaKpi[] = [];
  linhasMedia: LinhaKpi[] = [];
  resumoES: ResumoEntradaSaida | null = null;
  private resumoPeriodos: ResumoPeriodo[] = [];
  private totaisES: { entrada: number; saida: number; dias: number } | null = null;
  private diasPeriodo = 1;
  private granularidadeAtual: Granularidade = 'DIA';

  // ----- Avisos de qualidade dos dados -----
  dadosTruncados = false;
  leiturasAnomalas = 0;
  avisoEnergia = '';
  erroCarregamento: string | null = null;

  // ----- Controlo de pedidos concorrentes -----
  private pedidoAtivo: Subscription | null = null;
  private pedidoId = 0;

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
    this.pedidoAtivo?.unsubscribe();
  }

  // ===================== TRACKBY / FORMATADORES =====================

  trackByName = (_: number, item: { name: string }) => item.name;
  trackByLabel = (_: number, item: { label: string }) => item.label;
  trackByClientId = (_: number, c: Client) => c.id;
  trackByIndex = (i: number) => i;

  /** Arrow function: mantém o `this` e uma referência estável para o ngx-charts. */
  formatarDataLabel = (val: number): string => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString();
  };

  private gerarAnos(): number[] {
    const atual = new Date().getFullYear();
    const anos: number[] = [];
    for (let a = atual; a >= this.ANO_INICIAL; a--) anos.push(a);
    return anos.length > 0 ? anos : [atual];
  }

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
        this.clientesCarregados = true;
        this.atualizarListaClientesFiltrada();

        // Se o utilizador já escolheu filtros enquanto a lista carregava, aplica-os agora.
        if (this.isFiltrosCompletos()) this.recarregarDadosDashboard();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar clientes:', err);
        this.erroCarregamento = 'Não foi possível carregar a lista de estações.';
        this.cdr.markForCheck();
      }
    });
  }

  // ===================== EVENTOS DE FILTROS =====================

  onViewModeChange(): void {
    if (!this.viewMode) return;
    this.cancelarPedidoAtivo();
    this.resetMetrics();
    this.selectedMonth = null;
    this.selectedYear = null;
    this.selectedMonth2 = null;
    this.selectedYear2 = null;
    this.startDate = null;
    this.endDate = null;
    this.monthlyEnergyContent = new Array(12).fill(null);

    if (this.viewMode === 'ENTRADA_VS_SAIDA') {
      // Categoria e Estação não se aplicam a esta visão (usa sempre todas as estações).
      this.selectedCategories = ['ALL'];
      this.selectedClientIds = ['ALL'];
      this.atualizarListaClientesFiltrada();
      this.selectedYear = new Date().getFullYear();
      this.recarregarDadosDashboard();
    }
    this.cdr.markForCheck();
  }

  onCategoriaSelecionadaChange(categoriasSelecionadas: string[] | string | null): void {
    const cats: string[] = Array.isArray(categoriasSelecionadas)
      ? categoriasSelecionadas
      : (categoriasSelecionadas !== null && categoriasSelecionadas !== undefined ? [categoriasSelecionadas] : []);

    this.selectedCategories = this.normalizarSelecaoComAll(cats, this.selectedCategories) as string[];
    this.atualizarListaClientesFiltrada();

    // Remove estações escolhidas que já não pertencem às categorias selecionadas.
    if (!this.isAllClientsSelected) {
      const validos = new Set(this.listaClientesFiltradaPorCategoria.map(c => Number(c.id)));
      const restantes = this.selectedClientIds.filter(id => validos.has(Number(id)));
      this.selectedClientIds = restantes.length > 0 ? restantes : ['ALL'];
    }

    this.recarregarDadosDashboard();
    this.cdr.markForCheck();
  }

  onClienteSelecionadoChange(idsSelecionados: (number | string)[] | number | string | null): void {
    const ids: (number | string)[] = Array.isArray(idsSelecionados)
      ? idsSelecionados
      : (idsSelecionados !== null && idsSelecionados !== undefined ? [idsSelecionados] : []);

    this.selectedClientIds = this.normalizarSelecaoComAll(ids, this.selectedClientIds);
    this.recarregarDadosDashboard();
    this.cdr.markForCheck();
  }

  onDataInicioChange(valor: string | null): void {
    this.startDate = valor || null;
    this.recarregarDadosDashboard();
  }

  onDataFimChange(valor: string | null): void {
    this.endDate = valor || null;
    this.recarregarDadosDashboard();
  }

  /** Repõe todos os filtros no estado inicial, incluindo o Energy Content (global e mensal). */
  limparFiltros(): void {
    this.cancelarPedidoAtivo();
    this.viewMode = null;
    this.selectedCategories = ['ALL'];
    this.selectedClientIds = ['ALL'];
    this.selectedMonth = null;
    this.selectedYear = null;
    this.selectedMonth2 = null;
    this.selectedYear2 = null;
    this.startDate = null;
    this.endDate = null;
    this.monthlyEnergyContent = new Array(12).fill(null);
    this.energyContentMjSm3 = null;
    this.atualizarListaClientesFiltrada();
    this.resetMetrics();
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

  /** Visão Anual: copia um valor para os 12 meses (1.º mês preenchido; se nenhum, o valor do cartão laranja). */
  aplicarEnergyContentATodos(): void {
    const primeiroMensal = this.monthlyEnergyContent.find(v => Number(v) > 0);
    const global = Number(this.energyContentMjSm3);
    const valor = primeiroMensal !== undefined && primeiroMensal !== null
      ? Number(primeiroMensal)
      : (global > 0 ? global : 0);

    if (!(valor > 0)) {
      this.toastrService.warning('Preencha o Energy Content de pelo menos um mês (ou no cartão de Energia) e tente de novo.', 'Energy Content');
      return;
    }

    this.monthlyEnergyContent = new Array(12).fill(valor);
    this.recalcularEnergiaComNovoEnergyContent();
    this.cdr.markForCheck();
  }

  limparEnergyContentMensal(): void {
    this.monthlyEnergyContent = new Array(12).fill(null);
    this.recalcularEnergiaComNovoEnergyContent();
    this.cdr.markForCheck();
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
    const nome: string | null = evento?.name ?? evento?.label ?? null;
    if (!nome || nome.startsWith('Outras (')) return;

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
      case 'RANGE': {
        const ini = this.parseDataLocal(this.startDate);
        const fim = this.parseDataLocal(this.endDate);
        return !!ini && !!fim && ini.getTime() <= fim.getTime();
      }
      case 'MONTHCOMPARATION':
        return this.selectedMonth !== null &&
               this.selectedYear !== null &&
               this.selectedMonth2 !== null &&
               this.selectedYear2 !== null;
      case 'YEARCOMPARATION':
        return this.selectedYear !== null && this.selectedYear2 !== null;
      case 'ENTRADA_VS_SAIDA':
        // Ano obrigatório; Mês opcional (sem mês = ano inteiro).
        return this.selectedYear !== null;
      default:
        return false;
    }
  }

  isClienteEntrada(cliente: Client | undefined | null): boolean {
    return this.isNomeEntrada(cliente?.firstName);
  }

  /**
   * Estações de entrada: PRS1 e HPCMS3, com ou sem sufixo ("PRS1 (M1)", "PRS1(M2)", "PRS1 - M1").
   * O (?![A-Z0-9]) evita apanhar nomes como "PRS10".
   */
  private isNomeEntrada(nome: string | undefined | null): boolean {
    if (!nome) return false;
    return /^(PRS1|HPCMS3)(?![A-Z0-9])/.test(nome.trim().toUpperCase());
  }

  // ===================== PEDIDOS AO BACKEND =====================

  recarregarDadosDashboard(): void {
    this.cancelarPedidoAtivo();

    if (!this.isFiltrosCompletos() || !this.clientesCarregados) {
      this.resetMetrics();
      this.cdr.markForCheck();
      return;
    }

    const { ids, param } = this.resolverEstacoes();

    if (this.viewMode !== 'ENTRADA_VS_SAIDA' && ids.length === 0) {
      // Categoria/estação sem nenhuma estação correspondente: não pedir "tudo" ao backend.
      this.resetMetrics();
      this.cdr.markForCheck();
      return;
    }

    switch (this.viewMode) {
      case 'MONTHCOMPARATION': {
        const p1 = this.periodoMes(Number(this.selectedYear), Number(this.selectedMonth));
        const p2 = this.periodoMes(Number(this.selectedYear2), Number(this.selectedMonth2));
        const label1 = `${this.meses[Number(this.selectedMonth)]} / ${this.selectedYear}`;
        const label2 = `${this.meses[Number(this.selectedMonth2)]} / ${this.selectedYear2}`;
        this.executar(
          forkJoin({ r1: this.buscar(p1, param), r2: this.buscar(p2, param) }),
          (res: any) => this.processarComparacao(res.r1, res.r2, p1, p2, ids, label1, label2, 'DIA_DO_MES'),
          'Erro ao comparar meses.'
        );
        return;
      }

      case 'YEARCOMPARATION': {
        const p1 = this.periodoAno(Number(this.selectedYear));
        const p2 = this.periodoAno(Number(this.selectedYear2));
        this.executar(
          forkJoin({ r1: this.buscar(p1, param), r2: this.buscar(p2, param) }),
          (res: any) => this.processarComparacao(res.r1, res.r2, p1, p2, ids, `Ano ${this.selectedYear}`, `Ano ${this.selectedYear2}`, 'MES_DO_ANO'),
          'Erro ao comparar anos.'
        );
        return;
      }

      case 'ENTRADA_VS_SAIDA': {
        const periodo = this.obterPeriodo();
        if (!periodo) return;
        this.executar(
          this.buscar(periodo, undefined),
          (res: any) => this.processarEntradaSaida(res, periodo),
          'Erro ao carregar dados comparativos.'
        );
        return;
      }

      default: {
        const periodo = this.obterPeriodo();
        if (!periodo) return;
        this.executar(
          this.buscar(periodo, param),
          (res: any) => this.processarDadosConsumo(res, periodo, ids),
          'Erro ao carregar consumos.'
        );
      }
    }
  }

  /**
   * ids   → estações que o filtro abrange (usadas para filtrar a resposta e para as métricas).
   * param → o que se envia ao backend (undefined = sem filtro de estação).
   */
  private resolverEstacoes(): { ids: number[]; param: number[] | undefined } {
    const porCategoria = this.getClientIdsPorCategoria();

    if (this.isAllClientsSelected) {
      const todasCategorias = this.incluiEntradas && this.incluiSaidas;
      return { ids: porCategoria, param: todasCategorias ? undefined : porCategoria };
    }

    const selecionadas = this.getClientIdsSelecionados().filter(id => porCategoria.includes(id));
    return { ids: selecionadas, param: selecionadas };
  }

  private buscar(periodo: Periodo, clientIds: number[] | undefined): Observable<any> {
    // Pede alguns dias antes do início: a última leitura anterior ao período é a referência
    // para calcular o consumo do primeiro dia (ver calcularDeltas).
    const inicioComFolga = new Date(periodo.inicio);
    inicioComFolga.setDate(inicioComFolga.getDate() - this.DIAS_LOOKBACK);

    return this.consumptionService.filterConsumptions(0, this.LIMITE_REGISTOS, 'consumptionDate', 'asc', {
      clientIds,
      startDate: this.formatDateTimeToIso(inicioComFolga),
      endDate: this.formatDateTimeToIso(periodo.fim)
    });
  }

  /**
   * Executa um pedido cancelando o anterior. Garante que uma resposta antiga nunca
   * sobrescreve a mais recente e que o spinner só desliga quando o pedido ATUAL termina.
   */
  private executar<T>(pedido$: Observable<T>, aoReceber: (res: T) => void, mensagemErro: string): void {
    this.cancelarPedidoAtivo();
    const id = ++this.pedidoId;

    this.erroCarregamento = null;
    this.spinnerVisible = true;
    this.cdr.markForCheck();

    this.pedidoAtivo = pedido$
      .pipe(finalize(() => {
        if (id === this.pedidoId) {
          this.spinnerVisible = false;
          this.cdr.markForCheck();
        }
      }))
      .subscribe({
        next: (res) => {
          aoReceber(res);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(mensagemErro, err);
          this.resetMetrics();
          this.erroCarregamento = mensagemErro;
          this.cdr.markForCheck();
        }
      });
  }

  private cancelarPedidoAtivo(): void {
    this.pedidoId++; // invalida o `finalize` do pedido que vai ser cancelado
    this.pedidoAtivo?.unsubscribe();
    this.pedidoAtivo = null;
    this.spinnerVisible = false;
  }

  private verificarTruncagem(res: any, lista: any[]): boolean {
    const total = Number(res?.page?.totalElements ?? res?.totalElements ?? NaN);
    return (!isNaN(total) && total > lista.length) || lista.length >= this.LIMITE_REGISTOS;
  }

  // ===================== PERÍODOS E DATAS (sempre em hora local) =====================

  private obterPeriodo(): Periodo | null {
    const ano = this.selectedYear !== null ? Number(this.selectedYear) : null;
    const mes = this.selectedMonth !== null ? Number(this.selectedMonth) : null;

    switch (this.viewMode) {
      case 'MONTHLY':
        return ano !== null && mes !== null ? this.periodoMes(ano, mes) : null;
      case 'YEARLY':
        return ano !== null ? this.periodoAno(ano) : null;
      case 'ENTRADA_VS_SAIDA':
        if (ano === null) return null;
        return mes !== null ? this.periodoMes(ano, mes) : this.periodoAno(ano);
      case 'RANGE': {
        const ini = this.parseDataLocal(this.startDate);
        const fim = this.parseDataLocal(this.endDate);
        if (!ini || !fim || ini.getTime() > fim.getTime()) return null;
        return { inicio: ini, fim: this.fimDoDia(fim) };
      }
      default:
        return null;
    }
  }

  private periodoMes(ano: number, mes: number): Periodo {
    return { inicio: new Date(ano, mes, 1, 0, 0, 0), fim: new Date(ano, mes + 1, 0, 23, 59, 59) };
  }

  private periodoAno(ano: number): Periodo {
    return { inicio: new Date(ano, 0, 1, 0, 0, 0), fim: new Date(ano, 11, 31, 23, 59, 59) };
  }

  /**
   * 'yyyy-MM-dd' → Date à meia-noite LOCAL. `new Date('2026-11-03')` interpreta como UTC e,
   * em fusos com offset negativo, mostraria o dia anterior.
   */
  private parseDataLocal(valor: string | null): Date | null {
    if (!valor) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (isNaN(d.getTime()) || d.getMonth() !== Number(m[2]) - 1) return null; // rejeita 2026-02-31
    return d;
  }

  private fimDoDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  }

  private formatarDataBr(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /** Nº de dias de calendário entre duas datas, inclusive (imune a mudanças de hora). */
  private diasEntre(a: Date, b: Date): number {
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / 86400000) + 1;
  }

  /** Dias do período já decorridos até hoje (período futuro → 0). Usado na qualidade de dados. */
  private diasDecorridos(periodo: Periodo): number {
    const agora = new Date();
    if (periodo.inicio.getTime() > agora.getTime()) return 0;
    const fimEfetivo = periodo.fim.getTime() > agora.getTime() ? agora : periodo.fim;
    return Math.max(0, this.diasEntre(periodo.inicio, fimEfetivo));
  }

  /**
   * Divisor das médias diárias (o MESMO para m³/dia e GJ/dia).
   * - Período terminado: dias completos do período.
   * - Período em curso: dias até hoje, limitados à última leitura existente (a leitura de hoje
   *   pode ainda não ter chegado e não deve baixar a média).
   */
  private diasParaMedia(periodo: Periodo, ultimaLeitura: Date | null): number {
    const agora = new Date();
    let fimEfetivo = periodo.fim;

    if (periodo.fim.getTime() >= agora.getTime()) {
      fimEfetivo = agora;
      if (ultimaLeitura && ultimaLeitura.getTime() < fimEfetivo.getTime()) fimEfetivo = ultimaLeitura;
    }
    if (fimEfetivo.getTime() < periodo.inicio.getTime()) return 1;
    return Math.max(1, this.diasEntre(periodo.inicio, fimEfetivo));
  }

  private formatDateTimeToIso(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // ===================== NÚCLEO DE CÁLCULO DOS CONSUMOS =====================

  /**
   * Converte leituras em consumos (deltas), numa única passagem e com as mesmas regras para todas as vistas.
   *
   * - Se o backend envia `deltaVolume`, usa-o.
   * - Caso contrário, delta = leitura atual − leitura anterior da MESMA estação.
   * - Leituras anteriores ao período (pedidas com folga) só servem de referência: assim o consumo do
   *   1.º dia do período já não se perde.
   * - Contador a recuar: só é rollover se a leitura anterior estava perto do fundo de escala;
   *   caso contrário é anomalia (substituição/correção de contador) e o delta é ignorado,
   *   em vez de somar ~99 milhões de m³.
   */
  private calcularDeltas(registos: any[], periodo: Periodo, permitidos: Set<number> | null): ResultadoDeltas {
    const resultado: ResultadoDeltas = {
      deltas: [],
      leiturasAnomalas: 0,
      diasComDados: new Map(),
      nomes: new Map(),
      ultimaLeitura: null,
      energyContent: null
    };
    const leituraAnterior = new Map<number, number>();

    for (const c of this.ordenarPorData(registos)) {
      if (!c || !c.consumptionDate) continue;

      const data = new Date(c.consumptionDate);
      if (isNaN(data.getTime())) continue;

      const clientId = Number(c.clientId ?? c.client?.id ?? c.client_id ?? 0);
      if (permitidos && permitidos.size > 0 && !permitidos.has(clientId)) continue;

      if (resultado.energyContent === null) {
        const ec = Number(c.energyContent ?? c.energy_content);
        if (ec > 0) resultado.energyContent = ec;
      }

      const leitura = Number(c.volume ?? c.reading ?? c.correctedVolume ?? 0);
      let delta: number | null = null;
      let anomalia = false;

      if (c.deltaVolume !== undefined && c.deltaVolume !== null && Number(c.deltaVolume) >= 0) {
        delta = Number(c.deltaVolume);
      } else if (leituraAnterior.has(clientId)) {
        const teto = c.meterMaxCapacity ? Number(c.meterMaxCapacity) : this.DEFAULT_ROLLOVER_LIMIT;
        const r = this.calcularDeltaLeitura(leitura, leituraAnterior.get(clientId)!, teto);
        delta = r.delta;
        anomalia = r.anomalia;
      }
      leituraAnterior.set(clientId, leitura);

      const dentro = data.getTime() >= periodo.inicio.getTime() && data.getTime() <= periodo.fim.getTime();
      if (!dentro) continue;

      const nome = c.client?.firstName || this.clientesPorId.get(clientId)?.firstName || `Cliente #${clientId}`;
      resultado.nomes.set(clientId, nome);

      let dias = resultado.diasComDados.get(clientId);
      if (!dias) {
        dias = new Set<string>();
        resultado.diasComDados.set(clientId, dias);
      }
      dias.add(this.chaveOrdenavel(data, 'DIA'));

      if (!resultado.ultimaLeitura || data.getTime() > resultado.ultimaLeitura.getTime()) {
        resultado.ultimaLeitura = data;
      }

      if (delta === null) continue; // 1.ª leitura da estação sem referência anterior
      if (anomalia) resultado.leiturasAnomalas++;
      resultado.deltas.push({ clientId, clientName: nome, data, delta });
    }

    return resultado;
  }

  private calcularDeltaLeitura(atual: number, anterior: number, teto: number): { delta: number; anomalia: boolean } {
    if (isNaN(atual) || isNaN(anterior)) return { delta: 0, anomalia: true };
    if (atual >= anterior) return { delta: atual - anterior, anomalia: false };

    const rolloverPlausivel = anterior >= teto * 0.9;
    if (!rolloverPlausivel) return { delta: 0, anomalia: true };
    return { delta: Math.max(0, teto - anterior + atual), anomalia: false };
  }

  /** Cobertura real: dias com leitura ÷ (dias decorridos × estações esperadas). */
  private calcularQualidade(r: ResultadoDeltas, idsEsperados: number[], periodo: Periodo): number {
    const dias = this.diasDecorridos(periodo);
    if (dias <= 0 || idsEsperados.length === 0) return 0;

    let diasComLeitura = 0;
    idsEsperados.forEach(id => { diasComLeitura += r.diasComDados.get(id)?.size ?? 0; });
    return Math.min(100, Math.round((diasComLeitura / (dias * idsEsperados.length)) * 100));
  }

  // ===================== PROCESSAMENTO =====================

  private processarDadosConsumo(res: any, periodo: Periodo, idsEsperados: number[]): void {
    const lista = this.extrairLista(res);
    this.resetMetrics();
    if (lista.length === 0) return;

    const r = this.calcularDeltas(lista, periodo, new Set(idsEsperados));
    const granul: Granularidade = this.viewMode === 'YEARLY' ? 'MES' : 'DIA';
    const multiAno = periodo.inicio.getFullYear() !== periodo.fim.getFullYear();

    this.dadosTruncados = this.verificarTruncagem(res, lista);
    this.leiturasAnomalas = r.leiturasAnomalas;
    this.aplicarEnergyContentDosDados(r.energyContent);

    const totalPorEstacao = new Map<string, number>();
    r.diasComDados.forEach((_, id) => totalPorEstacao.set(r.nomes.get(id) ?? `Cliente #${id}`, 0));

    const serieDaEstacao = new Map<string, Map<string, number>>();
    let total = 0;

    for (const d of r.deltas) {
      total += d.delta;
      totalPorEstacao.set(d.clientName, (totalPorEstacao.get(d.clientName) ?? 0) + d.delta);

      let mapa = serieDaEstacao.get(d.clientName);
      if (!mapa) {
        mapa = new Map<string, number>();
        serieDaEstacao.set(d.clientName, mapa);
      }
      const chave = this.chaveOrdenavel(d.data, granul);
      mapa.set(chave, (mapa.get(chave) ?? 0) + d.delta);
    }

    this.granularidadeAtual = granul;
    this.diasPeriodo = this.diasParaMedia(periodo, r.ultimaLeitura);

    this.totalVolumeConsumido = this.arred(total, 2);
    this.totalRegistos = r.deltas.length;
    this.estacoesNoFiltro = idsEsperados.length;
    this.estacoesComDados = r.diasComDados.size;
    this.mediaConsumoDiarioM3 = total / this.diasPeriodo;

    this.volumePorCliente = Array.from(totalPorEstacao.entries())
      .map(([name, value]) => ({ name, value: this.arred(value, 2) }))
      .sort((a, b) => b.value - a.value);

    this.areaChartDataM3 = this.construirSeriesM3(serieDaEstacao, granul, multiAno);
    this.topConsumersData = this.construirTopConsumidores(totalPorEstacao, total);

    const { pico, minimo } = this.encontrarPicoEMinimo(this.areaChartDataM3.map(ds => ({
      nome: this.areaChartDataM3.length > 1 ? ds.name : '',
      pontos: ds.series
    })));
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    this.dataQualityScore = this.calcularQualidade(r, idsEsperados, periodo);
    this.recalcularEnergiaComNovoEnergyContent();
  }

  /** Comparação Mensal/Anual: os dois períodos ficam SEPARADOS (nunca somados). */
  private processarComparacao(
    res1: any, res2: any, p1: Periodo, p2: Periodo, idsEsperados: number[],
    label1: string, label2: string, modo: 'DIA_DO_MES' | 'MES_DO_ANO'
  ): void {
    const lista1 = this.extrairLista(res1);
    const lista2 = this.extrairLista(res2);
    this.resetMetrics();
    if (lista1.length === 0 && lista2.length === 0) return;

    const permitidos = new Set(idsEsperados);
    const r1 = this.calcularDeltas(lista1, p1, permitidos);
    const r2 = this.calcularDeltas(lista2, p2, permitidos);

    const series1 = this.serieComparacao(r1.deltas, modo);
    const series2 = this.serieComparacao(r2.deltas, modo);
    const vol1 = r1.deltas.reduce((acc, d) => acc + d.delta, 0);
    const vol2 = r2.deltas.reduce((acc, d) => acc + d.delta, 0);
    const dias1 = this.diasParaMedia(p1, r1.ultimaLeitura);
    const dias2 = this.diasParaMedia(p2, r2.ultimaLeitura);

    this.dadosTruncados = this.verificarTruncagem(res1, lista1) || this.verificarTruncagem(res2, lista2);
    this.leiturasAnomalas = r1.leiturasAnomalas + r2.leiturasAnomalas;
    this.aplicarEnergyContentDosDados(r1.energyContent ?? r2.energyContent);

    this.granularidadeAtual = modo === 'DIA_DO_MES' ? 'DIA' : 'MES';
    this.resumoPeriodos = [
      { label: label1, volumeM3: vol1, dias: dias1 },
      { label: label2, volumeM3: vol2, dias: dias2 }
    ];
    this.areaChartDataM3 = [
      { name: label1, series: series1 },
      { name: label2, series: series2 }
    ];

    // O Período 2 é o "atual"; o Período 1 é a referência da variação.
    this.diasPeriodo = dias2;
    this.totalVolumeConsumido = this.arred(vol2, 2);
    this.mediaConsumoDiarioM3 = vol2 / dias2;
    this.totalRegistos = r1.deltas.length + r2.deltas.length;
    this.estacoesNoFiltro = idsEsperados.length;
    this.estacoesComDados = new Set([...Array.from(r1.diasComDados.keys()), ...Array.from(r2.diasComDados.keys())]).size;

    const temDadosPeriodo1 = r1.deltas.length > 0;
    this.totalVolumeAnterior = temDadosPeriodo1 ? this.arred(vol1, 2) : null;
    this.variacaoPercentual = temDadosPeriodo1 && vol1 > 0
      ? this.arred(((vol2 - vol1) / vol1) * 100, 1)
      : null;

    const { pico, minimo } = this.encontrarPicoEMinimo([
      { nome: label1, pontos: series1 },
      { nome: label2, pontos: series2 }
    ]);
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    // Qualidade = pior dos dois períodos (abordagem conservadora)
    this.dataQualityScore = Math.min(
      this.calcularQualidade(r1, idsEsperados, p1),
      this.calcularQualidade(r2, idsEsperados, p2)
    );

    this.recalcularEnergiaComNovoEnergyContent();
  }

  /**
   * Entradas vs Saídas.
   * Erro (%) = (Entrada − Consumo) / Consumo × 100, com Consumo = Σ saídas. Ver `calcularErroPercentual`.
   */
  private processarEntradaSaida(res: any, periodo: Periodo): void {
    const lista = this.extrairLista(res);
    this.resetMetrics();
    if (lista.length === 0) return;

    const r = this.calcularDeltas(lista, periodo, null);
    const granul: Granularidade = this.selectedMonth !== null ? 'DIA' : 'MES';

    const mapEntradas = new Map<string, number>();
    const mapSaidas = new Map<string, number>();
    let totalEntrada = 0;
    let totalSaida = 0;

    for (const d of r.deltas) {
      const chave = this.chaveOrdenavel(d.data, granul);
      if (this.isNomeEntrada(d.clientName)) {
        mapEntradas.set(chave, (mapEntradas.get(chave) ?? 0) + d.delta);
        totalEntrada += d.delta;
      } else {
        mapSaidas.set(chave, (mapSaidas.get(chave) ?? 0) + d.delta);
        totalSaida += d.delta;
      }
    }

    const chaves = Array.from(new Set([...Array.from(mapEntradas.keys()), ...Array.from(mapSaidas.keys())])).sort();
    const rotulo = (k: string) => this.rotuloPeriodo(k, granul, false);
    const seriesEntradas = chaves.map(k => ({ name: rotulo(k), value: this.arred(mapEntradas.get(k) ?? 0, 3) }));
    const seriesSaidas = chaves.map(k => ({ name: rotulo(k), value: this.arred(mapSaidas.get(k) ?? 0, 3) }));

    this.dadosTruncados = this.verificarTruncagem(res, lista);
    this.leiturasAnomalas = r.leiturasAnomalas;
    this.aplicarEnergyContentDosDados(r.energyContent);

    this.granularidadeAtual = granul;
    this.diasPeriodo = this.diasParaMedia(periodo, r.ultimaLeitura);
    this.totaisES = { entrada: totalEntrada, saida: totalSaida, dias: this.diasPeriodo };

    this.areaChartDataM3 = [
      { name: '📥 Entradas (PRS1/HPCMS3)', series: seriesEntradas },
      { name: '📤 Saídas (Demais Estações)', series: seriesSaidas }
    ];

    // "Consumo real" = Σ saídas; as entradas e a diferença aparecem nos cartões próprios.
    this.totalVolumeConsumido = this.arred(totalSaida, 2);
    this.mediaConsumoDiarioM3 = totalSaida / this.diasPeriodo;
    this.totalRegistos = r.deltas.length;
    this.estacoesNoFiltro = this.listaClientes.length;
    this.estacoesComDados = r.diasComDados.size;

    const { pico, minimo } = this.encontrarPicoEMinimo([{ nome: '', pontos: seriesSaidas }]);
    this.picoConsumo = pico;
    this.minimoConsumo = minimo;

    this.dataQualityScore = this.calcularQualidade(
      r,
      this.listaClientes.map(c => Number(c.id)).filter(id => !isNaN(id)),
      periodo
    );

    this.recalcularEnergiaComNovoEnergyContent();
  }

  /** Erro (%) = (Entrada − Consumo) / Consumo × 100 = (Entrada / Consumo − 1) × 100. Sem consumo → indefinido. */
  private calcularErroPercentual(entrada: number, consumo: number): number | null {
    if (!(consumo > 0)) return null;
    return ((entrada - consumo) / consumo) * 100;
  }

  private construirSeriesM3(
    porEstacao: Map<string, Map<string, number>>, granul: Granularidade, multiAno: boolean
  ): any[] {
    const nomes = Array.from(porEstacao.keys());
    const rotulo = (k: string) => this.rotuloPeriodo(k, granul, multiAno);

    if (nomes.length <= 1) {
      const mapa = nomes.length > 0 ? porEstacao.get(nomes[0])! : new Map<string, number>();
      const series = Array.from(mapa.keys()).sort()
        .map(k => ({ name: rotulo(k), value: this.arred(mapa.get(k)!, 3) }));
      return [{ name: 'Consumo Real (m³)', series }];
    }

    const todasChaves = new Set<string>();
    porEstacao.forEach(mapa => mapa.forEach((_, k) => todasChaves.add(k)));
    const ordenadas = Array.from(todasChaves).sort();

    return nomes.map(nome => {
      const mapa = porEstacao.get(nome)!;
      return { name: nome, series: ordenadas.map(k => ({ name: rotulo(k), value: this.arred(mapa.get(k) ?? 0, 3) })) };
    });
  }

  /** Top N + fatia "Outras", para as percentagens somarem sempre 100%. */
  private construirTopConsumidores(
    totais: Map<string, number>, total: number
  ): { name: string; value: number; percent?: number }[] {
    const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
    const todos = Array.from(totais.entries())
      .map(([name, value]) => ({ name, value, percent: pct(value) }))
      .sort((a, b) => b.value - a.value);

    const top = todos.slice(0, this.MAX_ESTACOES_NO_TOP);
    const resto = todos.slice(this.MAX_ESTACOES_NO_TOP);

    if (resto.length > 0) {
      const soma = resto.reduce((acc, e) => acc + e.value, 0);
      top.push({ name: `Outras (${resto.length})`, value: soma, percent: pct(soma) });
    }
    return top.map(e => ({ ...e, value: this.arred(e.value, 2) }));
  }

  private serieComparacao(deltas: DeltaRegisto[], modo: 'DIA_DO_MES' | 'MES_DO_ANO'): PontoSerie[] {
    const mapa = new Map<number, number>();
    for (const d of deltas) {
      const k = modo === 'DIA_DO_MES' ? d.data.getDate() : d.data.getMonth();
      mapa.set(k, (mapa.get(k) ?? 0) + d.delta);
    }
    return Array.from(mapa.keys()).sort((a, b) => a - b).map(k => ({
      name: modo === 'DIA_DO_MES' ? `Dia ${String(k).padStart(2, '0')}` : this.meses[k],
      value: this.arred(mapa.get(k)!, 3)
    }));
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

  /** Chave ordenável: 'yyyy-MM-dd' (dia) ou 'yyyy-MM' (mês). Ordenar texto = ordenar no tempo, mesmo entre anos. */
  private chaveOrdenavel(d: Date, g: Granularidade): string {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return g === 'MES'
      ? `${d.getFullYear()}-${mes}`
      : `${d.getFullYear()}-${mes}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private rotuloPeriodo(chave: string, g: Granularidade, multiAno: boolean): string {
    const [ano, mes, dia] = chave.split('-');
    if (g === 'MES') {
      const nome = this.meses[Number(mes) - 1];
      return multiAno ? `${nome.slice(0, 3)}/${ano.slice(2)}` : nome;
    }
    return multiAno ? `${dia}/${mes}/${ano.slice(2)}` : `${dia}/${mes}`;
  }

  private arred(valor: number, casas: number): number {
    return Number((valor || 0).toFixed(casas));
  }

  // ===================== ENERGIA E KPIs =====================

  private aplicarEnergyContentDosDados(valor: number | null): void {
    if (valor && valor > 0 && !(Number(this.energyContentMjSm3) > 0)) {
      this.energyContentMjSm3 = valor;
    }
  }

  /** m³ → GJ com a fórmula original (energyStd = CONSTANTE / EnergyContent × 1000). */
  private m3ParaGJ(volumeM3: number, energyContent: number): number {
    if (!(energyContent > 0)) return 0;
    const energyStd = (this.CONSTANTE_ENERGIA_STD / energyContent) * 1000;
    return volumeM3 / energyStd;
  }

  private energyContentPara(nomeItem: string): number {
    if (this.viewMode === 'YEARLY') {
      const idx = this.meses.indexOf(nomeItem);
      if (idx !== -1 && Number(this.monthlyEnergyContent[idx]) > 0) return Number(this.monthlyEnergyContent[idx]);
    }
    return Number(this.energyContentMjSm3);
  }

  private recalcularEnergiaComNovoEnergyContent(): void {
    const temSeries = this.areaChartDataM3.some(ds => ds?.series?.length > 0);

    this.avisoEnergia = '';
    this.linhasM3 = [];
    this.linhasGJ = [];
    this.linhasMedia = [];
    this.resumoES = null;

    if (!temSeries) {
      this.energyStd = 0;
      this.totalEnergiaConsumidaGJ = 0;
      this.mediaConsumoDiarioGJ = 0;
      this.areaChartDataGJ = [{ name: 'Energia (GJ)', series: [] }];
    } else {
      const totaisGJ: number[] = [];
      const mesesSemContent = new Set<string>();
      let faltaContent = false;

      const novasSeriesGJ = this.areaChartDataM3.map((dataset: any) => {
        let acumulado = 0;
        const series = (dataset.series || []).map((item: PontoSerie) => {
          const content = this.energyContentPara(item.name);
          if (!(content > 0) && item.value > 0) {
            faltaContent = true;
            mesesSemContent.add(item.name);
          }
          const gj = this.m3ParaGJ(item.value, content);
          acumulado += gj;
          return { name: item.name, value: this.arred(gj, 4) };
        });
        
        totaisGJ.push(acumulado);

        const nome = dataset.name === 'Consumo Real (m³)' ? 'Energia Real (GJ)' : dataset.name;
        return { name: nome, series };
      });

      if (faltaContent) {
        this.avisoEnergia = this.viewMode === 'YEARLY' && mesesSemContent.size > 0
          ? `Sem Energy Content em: ${Array.from(mesesSemContent).join(', ')}. O GJ desses meses aparece como 0.`
          : 'Indique o Energy Content (MJ/m³) para calcular a energia em GJ.';
      }

      const global = Number(this.energyContentMjSm3);
      this.energyStd = global > 0 ? this.arred((this.CONSTANTE_ENERGIA_STD / global) * 1000, 3) : 0;
      this.areaChartDataGJ = novasSeriesGJ;
      this.aplicarResumoEnergia(totaisGJ);
    }

    this.recalcularKpisDerivados();
    this.atualizarApoioGraficos();
  }

  private aplicarResumoEnergia(totaisGJ: number[]): void {
    if (this.modoKpi === 'ENTRADA_SAIDA' && this.totaisES) {
      const t = this.totaisES;
      const entradaGJ = totaisGJ[0] ?? 0;
      const saidaGJ = totaisGJ[1] ?? 0;

      this.totalEnergiaConsumidaGJ = this.arred(saidaGJ, 2);
      this.mediaConsumoDiarioGJ = saidaGJ / t.dias;

      this.resumoES = {
        entradaM3: t.entrada, saidaM3: t.saida, diferencaM3: t.entrada - t.saida,
        erroM3: this.calcularErroPercentual(t.entrada, t.saida),
        entradaGJ, saidaGJ, diferencaGJ: entradaGJ - saidaGJ,
        erroGJ: this.calcularErroPercentual(entradaGJ, saidaGJ),
        diferencaMediaM3: (t.entrada - t.saida) / t.dias
      };
      this.linhasM3 = [
        { label: 'Entradas', value: t.entrada },
        { label: 'Consumo (Saídas)', value: t.saida },
        { label: 'Diferença (E − S)', value: t.entrada - t.saida, destaque: true }
      ];
      this.linhasGJ = [
        { label: 'Entradas', value: entradaGJ },
        { label: 'Consumo (Saídas)', value: saidaGJ },
        { label: 'Diferença (E − S)', value: entradaGJ - saidaGJ, destaque: true }
      ];
      return;
    }

    if (this.modoKpi === 'COMPARACAO' && this.resumoPeriodos.length === 2) {
      const [p1, p2] = this.resumoPeriodos;
      const gj1 = totaisGJ[0] ?? 0;
      const gj2 = totaisGJ[1] ?? 0;

      this.totalEnergiaConsumidaGJ = this.arred(gj2, 2);
      this.mediaConsumoDiarioGJ = gj2 / p2.dias;

      this.linhasM3 = [{ label: p1.label, value: p1.volumeM3 }, { label: p2.label, value: p2.volumeM3 }];
      this.linhasGJ = [{ label: p1.label, value: gj1 }, { label: p2.label, value: gj2 }];
      this.linhasMedia = [
        { label: p1.label, value: p1.volumeM3 / p1.dias, value2: gj1 / p1.dias },
        { label: p2.label, value: p2.volumeM3 / p2.dias, value2: gj2 / p2.dias }
      ];
      return;
    }

    const somaGJ = totaisGJ.reduce((acc, v) => acc + v, 0);
    this.totalEnergiaConsumidaGJ = this.arred(somaGJ, 2);
    this.mediaConsumoDiarioGJ = somaGJ / (this.diasPeriodo || 1);
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

  private atualizarApoioGraficos(): void {
    const media = (datasets: any[]): number => {
      let soma = 0;
      let n = 0;
      datasets.forEach(ds => (ds?.series || []).forEach((p: PontoSerie) => { soma += p.value; n++; }));
      return n > 0 ? soma / n : 0;
    };
    const rotulo = this.granularidadeAtual === 'MES' ? 'Média mensal' : 'Média diária';

    const mediaM3 = media(this.areaChartDataM3);
    const mediaGJ = media(this.areaChartDataGJ);
    this.referenciasM3 = mediaM3 > 0 ? [{ name: rotulo, value: Number(mediaM3.toFixed(2)) }] : [];
    this.referenciasGJ = mediaGJ > 0 ? [{ name: rotulo, value: Number(mediaGJ.toFixed(2)) }] : [];

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
    this.estacoesNoFiltro = 0;
    this.estacoesComDados = 0;
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
    this.linhasM3 = [];
    this.linhasGJ = [];
    this.linhasMedia = [];
    this.resumoES = null;
    this.resumoPeriodos = [];
    this.totaisES = null;
    this.diasPeriodo = 1;
    this.dadosTruncados = false;
    this.leiturasAnomalas = 0;
    this.avisoEnergia = '';
    this.erroCarregamento = null;
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

  private get periodoFormatado(): string {
    if (this.viewMode === 'MONTHLY' && this.selectedMonth !== null && this.selectedYear !== null) {
      return `${this.meses[Number(this.selectedMonth)]} / ${this.selectedYear}`;
    }
    if (this.viewMode === 'YEARLY' && this.selectedYear !== null) {
      return `${this.selectedYear}`;
    }
    if (this.viewMode === 'RANGE') {
      const ini = this.parseDataLocal(this.startDate);
      const fim = this.parseDataLocal(this.endDate);
      if (ini && fim) return `${this.formatarDataBr(ini)} - ${this.formatarDataBr(fim)}`;
    }
    return '';
  }

  get modoKpi(): ModoKpi {
    if (this.viewMode === 'ENTRADA_VS_SAIDA') return 'ENTRADA_SAIDA';
    if (this.viewMode === 'MONTHCOMPARATION' || this.viewMode === 'YEARCOMPARATION') return 'COMPARACAO';
    return 'NORMAL';
  }

  get mostrarRanking(): boolean {
    return this.modoKpi === 'NORMAL' && (this.isAllClientsSelected || this.isMultiplosClientesSelecionados);
  }

  get intervaloInvalido(): boolean {
    if (this.viewMode !== 'RANGE') return false;
    const ini = this.parseDataLocal(this.startDate);
    const fim = this.parseDataLocal(this.endDate);
    return !!ini && !!fim && ini.getTime() > fim.getTime();
  }

  get comparacaoPeriodosIguais(): boolean {
    if (this.viewMode === 'MONTHCOMPARATION') {
      return this.selectedMonth !== null && this.selectedYear !== null &&
             this.selectedMonth2 !== null && this.selectedYear2 !== null &&
             Number(this.selectedMonth) === Number(this.selectedMonth2) &&
             Number(this.selectedYear) === Number(this.selectedYear2);
    }
    if (this.viewMode === 'YEARCOMPARATION') {
      return this.selectedYear !== null && this.selectedYear2 !== null &&
             Number(this.selectedYear) === Number(this.selectedYear2);
    }
    return false;
  }

  get temFiltrosAtivos(): boolean {
    return this.viewMode !== null ||
           !this.selectedCategories.includes('ALL') ||
           !this.isAllClientsSelected ||
           Number(this.energyContentMjSm3) > 0 ||
           this.monthlyEnergyContent.some(v => Number(v) > 0);
  }

  get isFiltrosValidosForCertificado(): boolean {
    if (this.isAllClientsSelected || this.isMultiplosClientesSelecionados || !this.viewMode) return false;
    if (this.viewMode === 'MONTHLY') return this.selectedMonth !== null && this.selectedYear !== null;
    if (this.viewMode === 'YEARLY') return this.selectedYear !== null;
    if (this.viewMode === 'RANGE') return !!this.parseDataLocal(this.startDate) && !!this.parseDataLocal(this.endDate) && !this.intervaloInvalido;
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