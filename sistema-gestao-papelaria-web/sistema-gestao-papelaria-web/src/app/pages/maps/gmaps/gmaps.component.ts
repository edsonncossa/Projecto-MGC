import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
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
export class GmapsComponent implements OnInit {
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

  private map?: L.Map;
  private marcadores = new Map<number, L.Marker>();
  private rascunho?: L.Marker;

  constructor(
    private clientService: ClientService,
    private toastr: NbToastrService,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.carregarEstacoes();
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
    this.ajustarVista();
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
        this.ajustarVista();
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
    this.atualizarIcones();

    if (this.selecionada && this.temLocalizacao(this.selecionada)) {
      this.centrar(this.selecionada);
    }
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
    this.cancelar();
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
          this.toastr.success('Posição anterior reposta.', 'Alteração desfeita');
        },
        error: () => {
          this.aGuardar = false;
          this.toastr.danger('Não foi possível desfazer. Tente novamente.', 'Erro');
        },
      });
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

      marker.on('click', () => this.zone.run(() => this.selecionar(e)));
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
