import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LeafletControlLayersConfig } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

import { ClientService } from '@app/services/client.service';
import { StationLocation } from '@app/shared/models/client';

/** Acima desta distância, a nova posição gera um aviso antes de confirmar. */
const LIMITE_AVISO_METROS = 1000;

/** Caixa aproximada de Moçambique (só serve para avisar, nunca bloqueia). */
const LIMITES_MOCAMBIQUE = L.latLngBounds([-26.9, 30.2], [-10.4, 40.9]);

const COR_GUARDADA = '#00b383';
const COR_SELECIONADA = '#0a5c8a';
const COR_PROVISORIA = '#ff9f1a';
const COR_PESQUISA = '#7b3fe4';

/** Zoom mínimo ao mostrar umas coordenadas (nível de rua/edifício). */
const ZOOM_COORDENADAS = 18;

/** Rota do dashboard (ajuste se estiver montado noutro caminho). */
const ROTA_DASHBOARD = '/pages/dashboard';

/** Serviço público de geocodificação inversa (OpenStreetMap). Coordenadas → nome da zona. */
const URL_GEOCODIFICACAO = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Campos opcionais do cliente/estação mostrados em "Outros detalhes" (só aparecem se vierem preenchidos).
 * Ajuste as chaves aos campos reais do seu modelo StationLocation / Client.
 */
const CAMPOS_EXTRA: { rotulo: string; chaves: string[]; data?: boolean }[] = [
  { rotulo: 'Tipo', chaves: ['type', 'clientType', 'category'] },
  { rotulo: 'Estado', chaves: ['status', 'state', 'active'] },
  { rotulo: 'Morada', chaves: ['address', 'morada', 'endereco'] },
  { rotulo: 'Contacto', chaves: ['phone', 'phoneNumber', 'mobile', 'telephone', 'contact'] },
  { rotulo: 'E-mail', chaves: ['email'] },
  { rotulo: 'Descrição', chaves: ['description', 'descricao', 'notes', 'observacoes'] },
  { rotulo: 'Criada em', chaves: ['createdAt', 'createdDate', 'creationDate'], data: true },
];

/** Um valor de coordenada: decimal ou graus/minutos/segundos, com hemisfério opcional. */
const VALOR_COORD =
  `(?:[NSEWLO]\\s*)?[+-]?\\d+(?:[.,]\\d+)?` +
  `(?:\\s*[°º˚\\uFFFD]\\s*(?:\\d+\\s*['′’]\\s*(?:\\d+(?:[.,]\\d+)?\\s*(?:["″”]|'')\\s*)?)?)?` +
  `(?:\\s*[NSEWLO])?`;

/** Dois valores seguidos (latitude e longitude), separados por vírgula, ponto e vírgula ou espaço. */
const PAR_COORD = new RegExp(`^\\s*(${VALOR_COORD})\\s*[;,\\s]\\s*(${VALOR_COORD})\\s*$`, 'i');

type Eixo = 'lat' | 'lng';

interface ZonaInfo {
  zona: string;
  cidade: string | null;
  provincia: string | null;
  endereco: string | null;
}

interface DetalheExtra { rotulo: string; valor: string; }

interface AlteracaoAnterior {
  estacao: StationLocation;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'ngx-gmaps',
  styleUrls: ['./gmaps.component.scss'],
  templateUrl: './gmaps.component.html',
})
export class GmapsComponent implements OnInit, OnDestroy {
  private readonly ruas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; Contribuidores do OpenStreetMap',
  });

  private readonly satelite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Imagens &copy; Esri' },
  );

  options: L.MapOptions = {
    layers: [this.ruas],
    zoom: 12,
    center: L.latLng(-25.9653, 32.5892), // Maputo
    zoomControl: false,
    attributionControl: false,
  };

  layersControl: LeafletControlLayersConfig = {
    baseLayers: { Mapa: this.ruas, Satélite: this.satelite },
    overlays: {},
  };

  layersControlOptions: L.Control.LayersOptions = { position: 'topright', collapsed: true };

  layers: L.Layer[] = [];

  estacoes: StationLocation[] = [];
  selecionada: StationLocation | null = null;
  pendente: L.LatLng | null = null;
  reposicionar = false;
  aGuardar = false;
  carregando = true;

  filtroTexto = '';
  apenasSemLocalizacao = false;
  ultimaAlteracao: AlteracaoAnterior | null = null;

  // Pesquisa por coordenadas
  coordLat = '';
  coordLng = '';
  erroCoordenadas: string | null = null;
  avisoCoordenadas: string | null = null;
  procurado: L.LatLng | null = null;

  // Painel flutuante de detalhes
  detalhesAbertos = false;
  zona: ZonaInfo | null = null;
  zonaCarregando = false;
  zonaErro = false;

  private map?: L.Map;
  /** HttpClient sem interceptors: o pedido ao Nominatim nunca leva o token da aplicação. */
  private readonly httpExterno: HttpClient;
  private zonaSub?: Subscription;
  private readonly cacheZonas = new Map<string, ZonaInfo>();
  /** Pedido vindo do dashboard ("Ver no mapa"), aplicado quando as estações estiverem carregadas. */
  private pedidoDashboard: { ids: number[]; nome: string | null } | null = null;
  private focoPendente: StationLocation[] | null = null;
  private marcadores = new Map<number, L.Marker>();
  private rascunho?: L.Marker;
  private marcadorPesquisa?: L.Marker;

  constructor(
    private clientService: ClientService,
    private toastr: NbToastrService,
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    httpBackend: HttpBackend,
  ) {
    this.httpExterno = new HttpClient(httpBackend);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const ids = (params.get('ids') ?? '')
        .split(',')
        .map(v => Number(v))
        .filter(n => Number.isFinite(n) && n > 0);
      const nome = params.get('nome');
      if (ids.length === 0 && !nome) return;

      this.pedidoDashboard = { ids, nome };
      // Se as estações já estão carregadas (o componente foi reaproveitado), aplica já.
      if (!this.carregando) this.aplicarPedidoDashboard();
    });

    this.carregarEstacoes();
  }

  ngOnDestroy(): void {
    this.zonaSub?.unsubscribe();
  }

  // ===================== Estado derivado =====================

  get totalLocalizadas(): number {
    return this.estacoes.filter(e => this.temLocalizacao(e)).length;
  }

  get estacoesFiltradas(): StationLocation[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    return this.estacoes.filter(e => {
      if (this.apenasSemLocalizacao && this.temLocalizacao(e)) return false;
      return !texto || (e.firstName ?? '').toLowerCase().includes(texto);
    });
  }

  /** Só se pode marcar quando a estação não tem posição, ou quando se pediu para reposicionar. */
  get podeMarcar(): boolean {
    return !!this.selecionada && (!this.temLocalizacao(this.selecionada) || this.reposicionar);
  }

  get distanciaAtual(): number | null {
    if (!this.selecionada || !this.pendente || !this.temLocalizacao(this.selecionada)) return null;
    return L.latLng(this.selecionada.latitude as number, this.selecionada.longitude as number)
      .distanceTo(this.pendente);
  }

  get distanciaGrande(): boolean {
    return this.distanciaAtual !== null && this.distanciaAtual > LIMITE_AVISO_METROS;
  }

  get foraDeMocambique(): boolean {
    return !!this.pendente && !LIMITES_MOCAMBIQUE.contains(this.pendente);
  }

  get podeDesfazer(): boolean {
    return !!this.ultimaAlteracao && this.ultimaAlteracao.estacao === this.selecionada;
  }

  temLocalizacao(e: StationLocation): boolean {
    return e.latitude != null && e.longitude != null;
  }

  formatarCoordenada(n: number | null | undefined): string {
    return n == null ? '' : n.toFixed(6);
  }

  formatarDistancia(metros: number): string {
    return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1)} km`;
  }

  // ===================== Mapa =====================

  onMapReady(map: L.Map): void {
    this.map = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    if (this.focoPendente) {
      this.enquadrar(this.focoPendente);
      this.focoPendente = null;
    } else {
      this.ajustarVista();
    }
  }

  onMapClick(ev: L.LeafletMouseEvent): void {
    if (this.aGuardar) return;

    if (!this.selecionada) {
      this.toastr.info('Escolha primeiro uma estação na lista.', 'Nenhuma estação escolhida');
      return;
    }

    if (!this.podeMarcar) {
      this.toastr.info(
        'Esta estação já tem localização. Use "Reposicionar" se a quiser alterar.',
        'Localização protegida',
      );
      return;
    }

    this.definirPendente(ev.latlng);
  }

  ajustarVista(): void {
    if (!this.map || this.marcadores.size === 0) return;
    const grupo = L.featureGroup(Array.from(this.marcadores.values()));
    this.map.fitBounds(grupo.getBounds().pad(0.2), { maxZoom: 16 });
  }

  // ===================== Lista e seleção =====================

  carregarEstacoes(): void {
    this.carregando = true;
    this.clientService.findLocations().subscribe({
      next: (lista) => {
        this.estacoes = lista;
        this.carregando = false;
        this.desenharMarcadores();
        if (this.pedidoDashboard) this.aplicarPedidoDashboard();
        else this.ajustarVista();
      },
      error: () => {
        this.carregando = false;
        this.toastr.danger('Não foi possível carregar as estações.', 'Erro');
      },
    });
  }

  selecionar(e: StationLocation): void {
    if (this.aGuardar) return;

    // Ao mudar de estação, o rascunho não guardado é descartado.
    this.limparRascunho();
    this.reposicionar = false;
    this.selecionada = this.selecionada === e ? null : e;
    this.detalhesAbertos = !!this.selecionada;
    this.atualizarIcones();
    this.carregarZona(this.selecionada);

    if (this.selecionada && this.temLocalizacao(this.selecionada)) {
      this.centrar(this.selecionada);
    }
  }

  /** Clique num marcador: abre os detalhes; clicar de novo na estação já aberta desseleciona-a. */
  private aoClicarMarcador(e: StationLocation): void {
    if (this.selecionada === e && !this.detalhesAbertos) {
      this.detalhesAbertos = true;
      return;
    }
    this.selecionar(e);
  }

  fecharDetalhes(): void {
    this.detalhesAbertos = false;
  }

  // ===================== Vindo do dashboard =====================

  /** "PRS1 (M1)", "PRS1 - M2", "PRS1 M1" → "PRS1" (mesma regra do dashboard). */
  private chaveEstacao(nome: string | null | undefined): string {
    const n = (nome ?? '').trim();
    const m = /^(.+?)\s*(?:\(\s*(M\d+)\s*\)|[-–]\s*(M\d+)|\s(M\d+))$/i.exec(n);
    return (m ? m[1].trim() : n).toUpperCase();
  }

  private aplicarPedidoDashboard(): void {
    const pedido = this.pedidoDashboard;
    this.pedidoDashboard = null;
    if (!pedido) return;

    const chave = pedido.nome ? this.chaveEstacao(pedido.nome) : null;
    const encontradas = this.estacoes.filter(e =>
      pedido.ids.includes(Number(e.id)) || (!!chave && this.chaveEstacao(e.firstName) === chave));

    if (encontradas.length === 0) {
      this.toastr.warning(`Não encontrei "${pedido.nome ?? 'a estação'}" no mapa.`, 'Estação não encontrada');
      return;
    }

    // Garante que a estação não fica escondida por um filtro da lista.
    this.filtroTexto = '';
    this.apenasSemLocalizacao = false;

    const localizadas = encontradas.filter(e => this.temLocalizacao(e));
    const alvo = localizadas[0] ?? encontradas[0];

    this.limparRascunho();
    this.reposicionar = false;
    this.selecionada = alvo;
    this.detalhesAbertos = true;
    this.atualizarIcones();
    this.carregarZona(alvo);

    if (localizadas.length === 0) {
      this.toastr.info(
        `${alvo.firstName} ainda não tem localização. Clique no mapa para a marcar.`,
        'Sem localização',
      );
      return;
    }

    if (this.map) this.enquadrar(localizadas);
    else this.focoPendente = localizadas; // o mapa ainda não está pronto
  }

  /** Uma estação: aproxima-se dela. Várias (meters em sítios diferentes): mostra todas. */
  private enquadrar(lista: StationLocation[]): void {
    if (!this.map) return;
    const pontos = lista
      .filter(e => this.temLocalizacao(e))
      .map(e => L.latLng(e.latitude as number, e.longitude as number));
    if (pontos.length === 0) return;

    if (pontos.length === 1) {
      this.map.flyTo(pontos[0], Math.max(this.map.getZoom(), 16), { duration: 0.8 });
    } else {
      this.map.fitBounds(L.latLngBounds(pontos).pad(0.3), { maxZoom: 17 });
    }
  }

  // ===================== Detalhes da estação =====================

  /** Entradas: PRS1 e HPCMS3 (mesma regra do dashboard). */
  categoria(e: StationLocation | null): 'Entrada' | 'Saída' | null {
    if (!e?.firstName) return null;
    return /^(PRS1|HPCMS3)(?![A-Z0-9])/.test(e.firstName.trim().toUpperCase()) ? 'Entrada' : 'Saída';
  }

  /** Campos opcionais que a estação tenha preenchidos (ver CAMPOS_EXTRA). */
  get detalhesExtra(): DetalheExtra[] {
    if (!this.selecionada) return [];
    const origem = this.selecionada as unknown as Record<string, unknown>;
    const lista: DetalheExtra[] = [];

    for (const campo of CAMPOS_EXTRA) {
      const chave = campo.chaves.find(k => origem[k] !== undefined && origem[k] !== null && origem[k] !== '');
      if (!chave) continue;
      const bruto = origem[chave];
      if (typeof bruto === 'object') continue;

      let valor: string;
      if (typeof bruto === 'boolean') {
        valor = bruto ? 'Sim' : 'Não';
      } else if (campo.data && !isNaN(new Date(String(bruto)).getTime())) {
        valor = new Date(String(bruto)).toLocaleString('pt-PT');
      } else {
        valor = String(bruto);
      }
      lista.push({ rotulo: campo.rotulo, valor });
    }
    return lista;
  }

  get urlGoogleMaps(): string | null {
    const e = this.selecionada;
    return e && this.temLocalizacao(e)
      ? `https://www.google.com/maps?q=${e.latitude},${e.longitude}`
      : null;
  }

  copiarCoordenadas(): void {
    const e = this.selecionada;
    if (!e || !this.temLocalizacao(e)) return;
    const texto = `${this.formatarCoordenada(e.latitude)}, ${this.formatarCoordenada(e.longitude)}`;
    navigator.clipboard?.writeText(texto).then(
      () => this.toastr.success('Coordenadas copiadas.', 'Copiado'),
      () => this.toastr.warning('Não foi possível copiar.', 'Copiar'),
    );
  }

  verNoDashboard(): void {
    if (!this.selecionada) return;
    this.router.navigate([ROTA_DASHBOARD], {
      queryParams: { estacao: this.chaveEstacao(this.selecionada.firstName) },
    });
  }

  /** Nome da zona a partir das coordenadas (geocodificação inversa), com cache e cancelamento. */
  private carregarZona(e: StationLocation | null): void {
    this.zonaSub?.unsubscribe();
    this.zona = null;
    this.zonaErro = false;
    this.zonaCarregando = false;
    if (!e || !this.temLocalizacao(e)) return;

    const lat = e.latitude as number;
    const lng = e.longitude as number;
    const chave = `${lat.toFixed(5)},${lng.toFixed(5)}`;

    const emCache = this.cacheZonas.get(chave);
    if (emCache) {
      this.zona = emCache;
      return;
    }

    this.zonaCarregando = true;
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', String(lat))
      .set('lon', String(lng))
      .set('zoom', '16')
      .set('addressdetails', '1')
      .set('accept-language', 'pt');

    this.zonaSub = this.httpExterno.get<any>(URL_GEOCODIFICACAO, { params })
      .pipe(finalize(() => (this.zonaCarregando = false)))
      .subscribe({
        next: (res) => {
          const a = res?.address ?? {};
          const zona = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.residential
            || a.hamlet || a.village || a.town || a.city || a.county || '';
          if (!zona && !res?.display_name) {
            this.zonaErro = true;
            return;
          }
          const info: ZonaInfo = {
            zona: zona || 'Zona não identificada',
            cidade: a.city || a.town || a.municipality || a.county || null,
            provincia: a.state || null,
            endereco: res?.display_name ?? null,
          };
          this.cacheZonas.set(chave, info);
          this.zona = info;
        },
        error: () => { this.zonaErro = true; },
      });
  }

  centrar(e: StationLocation): void {
    if (!this.map || !this.temLocalizacao(e)) return;
    this.map.flyTo(
      [e.latitude as number, e.longitude as number],
      Math.max(this.map.getZoom(), 15),
      { duration: 0.8 },
    );
  }

  // ===================== Marcação em duas etapas =====================

  iniciarReposicionamento(): void {
    this.reposicionar = true;
  }

  /** Descarta a posição provisória e sai do modo de reposicionar. Nada é gravado. */
  cancelar(): void {
    if (this.aGuardar) return;
    this.limparRascunho();
    this.reposicionar = false;
  }

  @HostListener('document:keydown.escape')
  aoPremirEscape(): void {
    if (this.pendente || this.reposicionar) {
      this.cancelar();
    } else if (this.detalhesAbertos) {
      this.detalhesAbertos = false;
    }
  }

  /** Só aqui é que a posição vai para a base de dados. */
  confirmar(): void {
    if (!this.selecionada || !this.pendente || this.aGuardar) return;

    const estacao = this.selecionada;
    const anterior = this.temLocalizacao(estacao)
      ? { estacao, latitude: estacao.latitude as number, longitude: estacao.longitude as number }
      : null;

    const latitude = Number(this.pendente.lat.toFixed(6));
    const longitude = Number(this.pendente.lng.toFixed(6));

    this.aGuardar = true;
    this.clientService.updateLocation(estacao.id, latitude, longitude).subscribe({
      next: (guardada) => {
        estacao.latitude = guardada.latitude;
        estacao.longitude = guardada.longitude;
        this.ultimaAlteracao = anterior;
        this.aGuardar = false;
        this.limparRascunho();
        this.reposicionar = false;
        this.desenharMarcadores();
        if (this.selecionada === estacao) this.carregarZona(estacao);
        this.toastr.success(`Localização de ${estacao.firstName} guardada.`, 'Guardado');
      },
      error: () => {
        // A posição provisória mantém-se para poder tentar de novo.
        this.aGuardar = false;
        this.toastr.danger('Não foi possível guardar. Tente novamente.', 'Erro ao guardar');
      },
    });
  }

  /** Repõe a posição anterior da última estação reposicionada. */
  desfazer(): void {
    const alteracao = this.ultimaAlteracao;
    if (!alteracao || this.aGuardar) return;

    this.aGuardar = true;
    this.clientService.updateLocation(alteracao.estacao.id, alteracao.latitude, alteracao.longitude)
      .subscribe({
        next: (guardada) => {
          alteracao.estacao.latitude = guardada.latitude;
          alteracao.estacao.longitude = guardada.longitude;
          this.ultimaAlteracao = null;
          this.aGuardar = false;
          this.desenharMarcadores();
          this.centrar(alteracao.estacao);
          if (this.selecionada === alteracao.estacao) this.carregarZona(alteracao.estacao);
          this.toastr.success('Posição anterior reposta.', 'Alteração desfeita');
        },
        error: () => {
          this.aGuardar = false;
          this.toastr.danger('Não foi possível desfazer. Tente novamente.', 'Erro');
        },
      });
  }

  // ===================== Pesquisa por coordenadas =====================

  /**
   * Converte uma coordenada em graus decimais. Aceita:
   *  - decimal: "-25,9653" ou "-25.9653"
   *  - graus/minutos/segundos: `32°29'24.52"E`, `25°57'55,1"S`, `S 25° 57' 55"`, `25 57 55 S`
   *  - hemisfério N/S/E/W (ou L/O em português); S, W e O tornam o valor negativo.
   * Devolve NaN se o texto não for válido ou se o hemisfério não corresponder ao eixo.
   */
  private lerNumero(texto: string, eixo: Eixo): number {
    let t = (texto ?? '')
      .trim()
      .toUpperCase()
      .replace(/[º˚]/g, '°')
      .replace(/[′’‘`´]/g, "'")
      .replace(/[″”“]/g, '"')
      .replace(/''/g, '"');
    if (!t) return NaN;

    // Hemisfério (letra no início ou no fim)
    let negativo = false;
    const hem = t.match(/^([NSEWLO])(?=[\s\d+-])|([NSEWLO])$/);
    if (hem) {
      const letra = hem[1] ?? hem[2];
      const eixoDaLetra: Eixo = 'NS'.includes(letra) ? 'lat' : 'lng';
      if (eixoDaLetra !== eixo) return NaN;
      negativo = 'SWO'.includes(letra);
      t = t.replace(/^([NSEWLO])|([NSEWLO])$/, '').trim();
    }

    // Sinal
    if (t.startsWith('-')) {
      negativo = true;
      t = t.slice(1).trim();
    } else if (t.startsWith('+')) {
      t = t.slice(1).trim();
    }

    // Números do texto: [graus] [minutos] [segundos]. Qualquer símbolo entre eles
    // (°, º, ', ", espaço ou um carácter corrompido como �) serve de separador.
    const NUMERO = /\d+(?:[.,]\d+)?/g;
    const numeros = t.match(NUMERO);
    if (!numeros || numeros.length > 3) return NaN;
    // Não pode sobrar texto que não seja separador (letras, outros sinais, etc.)
    if (/[A-Z0-9+\-]/.test(t.replace(NUMERO, ''))) return NaN;
    // Só o último número pode ter casas decimais (ex.: 25°57'55,1")
    if (numeros.slice(0, -1).some(n => /[.,]/.test(n))) return NaN;

    const [graus, minutos = 0, segundos = 0] = numeros.map(n => Number(n.replace(',', '.')));
    if (minutos >= 60 || segundos >= 60) return NaN;

    let valor = graus + minutos / 60 + segundos / 3600;
    valor = Number(valor.toFixed(6));
    return negativo ? -valor : valor;
  }

  /** Decimal com 6 casas e vírgula, no mesmo formato dos exemplos dos campos. */
  private paraTextoDecimal(n: number): string {
    return n.toFixed(6).replace('.', ',');
  }

  /**
   * Converte automaticamente o texto de um campo para decimal.
   * Se o texto não for válido, deixa-o como está (o erro aparece ao mostrar no mapa).
   */
  private normalizarCampo(eixo: Eixo): void {
    const texto = eixo === 'lat' ? this.coordLat : this.coordLng;
    if (!texto.trim()) return;

    const valor = this.lerNumero(texto, eixo);
    if (Number.isNaN(valor)) return;

    const decimal = this.paraTextoDecimal(valor);
    if (eixo === 'lat') this.coordLat = decimal;
    else this.coordLng = decimal;
  }

  /** Ao sair de um campo, converte para decimal o que foi escrito. */
  aoSairCampo(eixo: Eixo): void {
    this.normalizarCampo(eixo);
  }

  /**
   * Ao colar:
   *  - "latitude, longitude" (decimal ou graus/minutos/segundos) no campo da latitude
   *    preenche os dois campos já em decimal e mostra no mapa;
   *  - um único valor (ex.: 32°29'24.52"E) é convertido para decimal no próprio campo.
   */
  aoColar(ev: ClipboardEvent, eixo: Eixo): void {
    const texto = ev.clipboardData?.getData('text') ?? '';

    if (eixo === 'lat') {
      const par = texto.match(PAR_COORD);
      if (par) {
        ev.preventDefault();
        this.coordLat = par[1];
        this.coordLng = par[2];
        this.mostrarCoordenadas();
        return;
      }
    }

    const valor = this.lerNumero(texto, eixo);
    if (Number.isNaN(valor)) return; // deixa colar normalmente

    ev.preventDefault();
    const decimal = this.paraTextoDecimal(valor);
    if (eixo === 'lat') this.coordLat = decimal;
    else this.coordLng = decimal;
    this.erroCoordenadas = null;
  }

  mostrarCoordenadas(): void {
    this.erroCoordenadas = null;
    this.avisoCoordenadas = null;

    if (!this.coordLat.trim() || !this.coordLng.trim()) {
      this.erroCoordenadas = 'Preencha a latitude e a longitude.';
      return;
    }

    const lat = this.lerNumero(this.coordLat, 'lat');
    const lng = this.lerNumero(this.coordLng, 'lng');

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      this.erroCoordenadas =
        'Formato inválido. Use decimais (-25,965300) ou graus/minutos/segundos (25°57\'55,1"S). ' +
        'A latitude usa N/S e a longitude usa E/W (ou L/O).';
      return;
    }
    if (lat < -90 || lat > 90) {
      this.erroCoordenadas = 'A latitude tem de estar entre -90 e 90.';
      return;
    }
    if (lng < -180 || lng > 180) {
      this.erroCoordenadas = 'A longitude tem de estar entre -180 e 180.';
      return;
    }

    // Mostra nos campos o valor já convertido para decimal
    this.coordLat = this.paraTextoDecimal(lat);
    this.coordLng = this.paraTextoDecimal(lng);

    const ponto = L.latLng(lat, lng);

    if (!LIMITES_MOCAMBIQUE.contains(ponto)) {
      this.avisoCoordenadas = LIMITES_MOCAMBIQUE.contains(L.latLng(-lat, lng))
        ? 'Em Moçambique a latitude é negativa (hemisfério sul). Faltará o sinal "-" ou a letra S?'
        : 'Atenção: estas coordenadas ficam fora de Moçambique.';
    }

    this.procurado = ponto;
    this.desenharMarcadorPesquisa();

    if (this.map) {
      this.map.flyTo(ponto, Math.max(this.map.getZoom(), ZOOM_COORDENADAS), { duration: 0.8 });
    }
  }

  limparPesquisa(): void {
    this.coordLat = '';
    this.coordLng = '';
    this.erroCoordenadas = null;
    this.avisoCoordenadas = null;
    this.procurado = null;
    this.marcadorPesquisa = undefined;
    this.atualizarLayers();
  }

  /** Passa as coordenadas pesquisadas para a posição provisória da estação escolhida. */
  usarParaEstacao(): void {
    if (!this.procurado || !this.podeMarcar || this.aGuardar) return;
    const ponto = this.procurado;
    this.limparPesquisa();
    this.definirPendente(ponto);
  }

  private desenharMarcadorPesquisa(): void {
    if (!this.procurado) return;

    const texto = `${this.formatarCoordenada(this.procurado.lat)}, ${this.formatarCoordenada(this.procurado.lng)}`;

    this.marcadorPesquisa = L.marker(this.procurado, {
      draggable: false,
      icon: this.criarIcone(COR_PESQUISA, 'pesquisa'),
      zIndexOffset: 1500,
      keyboard: false,
    }).bindTooltip(texto, { permanent: true, direction: 'top', offset: [0, -34] });

    this.atualizarLayers();
  }

  // ===================== Marcadores =====================

  private definirPendente(latlng: L.LatLng): void {
    this.pendente = latlng;

    if (!this.rascunho) {
      this.rascunho = L.marker(latlng, {
        draggable: true,
        icon: this.criarIcone(COR_PROVISORIA, 'rascunho'),
        zIndexOffset: 1000,
        keyboard: false,
      }).bindTooltip('Posição provisória (ainda não guardada)', { direction: 'top', offset: [0, -34] });

      this.rascunho.on('dragend', () => {
        this.zone.run(() => {
          if (this.rascunho) this.pendente = this.rascunho.getLatLng();
        });
      });
    } else {
      this.rascunho.setLatLng(latlng);
    }

    this.atualizarLayers();
  }

  private limparRascunho(): void {
    this.pendente = null;
    this.rascunho = undefined;
    this.atualizarLayers();
  }

  private desenharMarcadores(): void {
    this.marcadores.clear();

    this.estacoes.filter(e => this.temLocalizacao(e)).forEach(e => {
      const selecionada = e === this.selecionada;
      const marker = L.marker([e.latitude as number, e.longitude as number], {
        draggable: false, // posições guardadas ficam bloqueadas: não se movem por engano
        icon: this.criarIcone(selecionada ? COR_SELECIONADA : COR_GUARDADA, selecionada ? 'selecionada' : ''),
        zIndexOffset: selecionada ? 500 : 0,
        title: e.firstName,
      }).bindTooltip(e.firstName, { direction: 'top', offset: [0, -34] });

      marker.on('click', () => this.zone.run(() => this.aoClicarMarcador(e)));
      this.marcadores.set(e.id, marker);
    });

    this.atualizarLayers();
  }

  private atualizarIcones(): void {
    this.marcadores.forEach((marker, id) => {
      const selecionada = id === this.selecionada?.id;
      marker.setIcon(this.criarIcone(selecionada ? COR_SELECIONADA : COR_GUARDADA, selecionada ? 'selecionada' : ''));
      marker.setZIndexOffset(selecionada ? 500 : 0);
    });
  }

  private atualizarLayers(): void {
    const camadas: L.Layer[] = Array.from(this.marcadores.values());
    if (this.rascunho) camadas.push(this.rascunho);
    if (this.marcadorPesquisa) camadas.push(this.marcadorPesquisa);
    this.layers = camadas;
  }

  private criarIcone(cor: string, classe: string): L.DivIcon {
    return L.divIcon({
      className: `pin ${classe}`.trim(),
      html: `<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true">
               <path d="M16 1C7.7 1 1 7.6 1 15.8 1 26.6 16 41 16 41s15-14.4 15-25.2C31 7.6 24.3 1 16 1z"
                     fill="${cor}" stroke="#ffffff" stroke-width="2"/>
               <circle cx="16" cy="15.5" r="5.5" fill="#ffffff"/>
             </svg>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });
  }
}
