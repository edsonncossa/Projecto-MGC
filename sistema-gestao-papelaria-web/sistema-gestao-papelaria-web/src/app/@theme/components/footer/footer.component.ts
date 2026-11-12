import { Component } from '@angular/core';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">© {{ year }} MGC · Todos os direitos reservados</span>
    <span class="secure">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="10" width="14" height="10" rx="2.5" />
        <path d="M8 10V8a4 4 0 018 0v2" />
      </svg>
      Ligação segura e encriptada
    </span>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
