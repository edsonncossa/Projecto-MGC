export interface MenuItem {
  link: string;
  icon: string;
  label: string;
  roles?: string[]; // array de roles permitidos (opcional)
  children?: MenuItem[]; // array de filhos (opcional)
}
