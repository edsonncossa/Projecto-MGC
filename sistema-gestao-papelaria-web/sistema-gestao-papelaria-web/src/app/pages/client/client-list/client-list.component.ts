import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Route, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { Client, ClientType, ClientTypeLabel } from '../../../shared/models/client';
import { ClientService } from '@app/services/client.service';
import { ConfirmDialogComponent } from '@app/shared/dialog/confirm-dialog.component';
import { SnackbarService } from '@app/services/snackbar.service';
import { AddClientDialogComponent } from '@app/shared/dialog/client/add-client-dialog/add-client-dialog.component';
import { AuthService } from '@app/services/auth.service';
import { User } from '@app/shared/models/user';
import { StationLogoService } from '@app/services/station-logo.service';
import { LogoPickerDialogComponent } from '@app/shared/dialog/logo-picker-dialog.component';

import { 
  NbCardModule, 
  NbIconModule, 
  NbButtonModule, 
  NbInputModule 
} from '@nebular/theme';

/**
 * Caminho de reserva do mapa. Normalmente não é usado: `rotaDoMapa()` descobre o caminho real
 * na configuração de rotas. Se o botão "Ver no mapa" avisar que não encontrou a rota, copie para
 * aqui o endereço que aparece no browser quando abre o mapa pelo menu (sem ?parâmetros).
 */
const ROTA_MAPA = '/pages/maps/gmaps';
const ROTA_DASHBOARD = '/pages/dashboard';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    // Módulos Nebular necessários para o HTML
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule
  ]
})
export class ClientListComponent implements AfterViewInit, OnInit, OnDestroy {

  displayedColumns: string[] = [
    'firstName',
    'email',
    'phoneNumber',
    'address',
    'type',
    'action'
  ];

  dataSource: Client[] = [];
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  /** Texto como o utilizador o escreve (campo) e valor já normalizado enviado ao backend. */
  textoPesquisa = '';
  filterValue = '';
  carregando = false;

  private pesquisa$ = new Subject<string>();
  private subscricoes = new Subscription();

  clientTypeLabel = ClientTypeLabel;
  user: User | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clientService: ClientService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
    private auth: AuthService,
    private router: Router,
    private logos: StationLogoService
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.user = this.auth.getUser();

    // Espera 300 ms depois de parar de escrever: evita um pedido por tecla.
    this.subscricoes.add(this.pesquisa$.pipe(debounceTime(300)).subscribe(valor => {
      this.filterValue = valor.trim().toLowerCase();
      this.pageIndex = 0;
      this.loadClients();
    }));
  }

  ngOnDestroy(): void {
    this.subscricoes.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe(() => {
      this.pageIndex = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.loadClients();
    });

    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.pageIndex = 0;
        this.loadClients();
      });
    }
  }

  aoPesquisar(valor: string): void {
    this.textoPesquisa = valor;
    this.pesquisa$.next(valor);
  }

  limparPesquisa(): void {
    this.textoPesquisa = '';
    this.filterValue = '';
    this.pageIndex = 0;
    this.loadClients();
  }

  // ===================== Ligação ao mapa e ao dashboard =====================

  /** "PRS1 (M1)", "PRS1 - M2", "PRS1 M1" → "PRS1" (mesma regra do mapa e do dashboard). */
  private chaveEstacao(nome: string | null | undefined): string {
    const n = (nome ?? '').trim();
    const m = /^(.+?)\s*(?:\(\s*(M\d+)\s*\)|[-–]\s*(M\d+)|\s(M\d+))$/i.exec(n);
    return (m ? m[1].trim() : n).toUpperCase();
  }

  /** Estações de entrada: PRS1 e HPCMS3 (mesma regra do dashboard). */
  ehEntrada(client: Client): boolean {
    return /^(PRS1|HPCMS3)(?![A-Z0-9])/.test((client.firstName ?? '').trim().toUpperCase());
  }

  /** Logo da estação (ficheiro de assets ou imagem carregada), ou null. */
  logoDe(client: Client): string | null {
    return this.logos.obter(client.firstName);
  }

  /** Abre o seletor de logotipo; o logo vale para todos os meters da mesma estação (PRS1 M1 e M2). */
  escolherLogo(client: Client): void {
    const ref = this.dialog.open(LogoPickerDialogComponent, {
      width: '480px',
      data: { nome: client.firstName, atual: this.logoDe(client) }
    });

    ref.afterClosed().subscribe((valor: string | undefined) => {
      if (valor === undefined) return;            // cancelou
      if (valor === '') {
        this.logos.remover(client.firstName);
        this.snackbar.success('Logotipo removido.');
      } else {
        this.logos.definir(client.firstName, valor);
        this.snackbar.success('Logotipo atualizado.');
      }
    });
  }

  inicial(client: Client): string {
    return (client.firstName ?? '?').trim().charAt(0).toUpperCase() || '?';
  }

  /**
   * Descobre o caminho do mapa na configuração de rotas da aplicação: procura, em qualquer nível,
   * a rota "maps"/"mapa" (onde está o módulo do mapa) e acrescenta "gmaps". Assim funciona
   * seja qual for o prefixo (/pages, /admin, …). Se não encontrar, usa ROTA_MAPA.
   */
  private rotaDoMapa(): string {
    const procurar = (rotas: Route[], prefixo: string): string | null => {
      for (const r of rotas) {
        const caminho = r.path ?? '';
        const completo = caminho ? `${prefixo}/${caminho}` : prefixo;

        if (/^gmaps$/i.test(caminho)) return completo;
        if (/^(g?maps?|mapas?)$/i.test(caminho)) return `${completo}/gmaps`;

        // `_loadedRoutes` só existe em módulos lazy já visitados; é opcional.
        const filhos = r.children ?? (r as { _loadedRoutes?: Route[] })._loadedRoutes;
        if (filhos) {
          const achada = procurar(filhos, completo);
          if (achada) return achada;
        }
      }
      return null;
    };
    return procurar(this.router.config, '') ?? ROTA_MAPA;
  }

  /**
   * Abre o mapa com ESTA estação selecionada. Envia só o id: o parâmetro `nome` faria o mapa
   * juntar todos os meters do mesmo grupo (ex.: PRS1 M1 e M2) e escolher o primeiro localizado.
   */
  verNoMapa(client: Client): void {
    const destino = this.rotaDoMapa();
    this.router.navigate([destino], { queryParams: { ids: client.id } }).then(ok => {
      // Uma rota inexistente cai na rota "curinga" (normalmente o dashboard): avisa em vez de calar.
      if (ok && !this.router.url.split('?')[0].startsWith(destino)) {
        this.snackbar.error(
          `Não encontrei a página do mapa em "${destino}". Ajuste ROTA_MAPA no client-list.component.ts.`);
      }
    });
  }

  verNoDashboard(client: Client): void {
    this.router.navigate([ROTA_DASHBOARD], {
      queryParams: { estacao: this.chaveEstacao(client.firstName), cliente: client.id },
    });
  }

  loadClients(): void {
    const direction = this.sort?.direction || 'asc';
    const sortField = this.sort?.active || 'firstName';
    this.carregando = true;

    this.clientService.findAll(
      this.pageIndex,
      this.pageSize,
      sortField,
      direction,
      this.filterValue
    ).subscribe({
      next: (response) => {
        this.dataSource = response._embedded?.clients ?? response.content ?? [];
        this.totalElements = response.page?.totalElements ?? response.totalElements ?? 0;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar estações:', err);
        this.dataSource = [];
        this.totalElements = 0;
        this.carregando = false;
        this.snackbar.error('Erro ao carregar estações!');
      }
    });
  }

  abrirDialog(): void {
    const dialogRef = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: Client | undefined) => {
      if (result) {
        this.loadClients();
      }
    });
  }

  editarCliente(client: Client): void {
    const dialogRef = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      data: { client }
    });

    dialogRef.afterClosed().subscribe((result: Client | undefined) => {
      if (result) {
        this.loadClients();
      }
    });
  }

  desativarCliente(client: Client): void {
    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desativar Cliente',
        message: `Tem certeza que deseja desativar o cliente "${client.firstName}"?`,
        confirmText: 'Desativar',
        cancelText: 'Cancelar',
        color: 'warn',
        icon: 'fa-trash-can',
        iconColor: '#DC2626'
      }
    });

    confirmDialog.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && client.id) {
        this.clientService.disableClient(client.id).subscribe({
          next: () => {
            this.loadClients();
            this.snackbar.success('Cliente desativado com sucesso!');
          },
          error: () => {
            this.snackbar.error('Erro ao desativar cliente.');
          }
        });
      }
    });
  }

  getClientTypeLabel(type: ClientType): string {
    switch (type) {
      case ClientType.COMPANY:
        return 'Empresa';
      default:
        return type || 'Padrão';
    }
  }
}