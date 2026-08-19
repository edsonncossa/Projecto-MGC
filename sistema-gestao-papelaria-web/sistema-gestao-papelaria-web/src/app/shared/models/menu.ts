import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'home-outline',
    link: '/dashboard',
    home: true,
  },
  {
    title: 'GESTÃO DE CONSUMO',
    group: true,
  },
  {
    title: 'Clientes',
    icon: 'people-outline',
    link: '/client',
  },
    /*{
    title: 'Emitir Certificado',
    icon: 'award-outline',
    link: '/certificate',
  },*/
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
  }
];