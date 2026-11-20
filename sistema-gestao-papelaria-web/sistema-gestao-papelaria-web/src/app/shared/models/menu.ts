import { NbMenuItem } from '@nebular/theme';
import { MODULE_CODES } from './module-codes';

/**
 * Cada item pode ter `data.module` (código do módulo a que pertence).
 * Sem `data.module`, o item aparece em todos os módulos (ex.: Configurações, Suporte).
 */
export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'home-outline',
    home: true,
    link: '/dashboard',
    data: { module: MODULE_CODES.CONSUMPTION },
  },
  {
    title: 'GESTÃO DE CONSUMO',
    group: true,
    data: { module: MODULE_CODES.CONSUMPTION },
  },
  {
    title: 'Estações',
    icon: 'people-outline',
    link: '/client',
    data: { module: MODULE_CODES.CONSUMPTION },
  },
  {
    title: 'LOCALIZAÇÃO DAS ESTAÇÕES',
    group: true,
    data: { module: MODULE_CODES.CONSUMPTION },
  },
  {
    title: 'Mapa de Localização',
    icon: 'map',
    link: '/maps',
    data: { module: MODULE_CODES.CONSUMPTION },
  },
  {
    title: 'CONFIGURAÇÕES',
    group: true,
  },
  {
    title: 'Configurações',
    icon: 'settings-outline',
    link: '/settings',
  },
  {
    title: 'Suporte',
    icon: 'phone-outline',
    link: '/support',
  },
];

/**
 * Devolve o menu do módulo activo, filtrado também por roles quando o item as define.
 * Remove cabeçalhos de grupo que fiquem sem itens por baixo.
 */
export function buildMenu(moduleCode: string | null, userRoles: string[] = []): NbMenuItem[] {
  const visible = MENU_ITEMS.filter((item: any) => {
    const itemModule: string | undefined = item.data?.module;
    if (itemModule && itemModule !== moduleCode) return false;
    return !item.roles || item.roles.some((r: string) => userRoles.includes(r));
  });

  // Um grupo só fica se o item seguinte não for outro grupo nem o fim da lista.
  return visible.filter((item, i) => !item.group || (visible[i + 1] && !visible[i + 1].group));
}
