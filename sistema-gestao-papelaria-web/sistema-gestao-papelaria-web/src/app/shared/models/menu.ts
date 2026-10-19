import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
{
    title: 'Dashboard',
    icon: 'home-outline',
    home: true,
  },
  {
    title: 'GESTÃO DE CONSUMO',
    group: true,
  },
  {
    title: 'Estações',
    icon: 'people-outline',
    link: '/client',
  },
    {
    title: 'LOCALIZAÇÃO DAS ESTAÇÕES  ',
    group: true,
  },
  {
    title: 'Mapa de Localização',
    icon: 'map',
    link: '',
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