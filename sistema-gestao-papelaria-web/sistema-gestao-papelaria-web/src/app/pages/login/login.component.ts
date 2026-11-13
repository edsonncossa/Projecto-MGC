import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  hidePassword = true;
  form: FormGroup;
  submitted = false; // Controla a exibição das validações após tentativa de submissão
  loading = false;   // Estado de carregamento do botão
  year = new Date().getFullYear();

  /** Mensagem de erro vinda do servidor/rede. Aparece por baixo da password. */
  serverError: string | null = null;
  /** true só quando o problema são as credenciais: aí os dois campos ficam a vermelho. */
  credentialsError = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Assim que o utilizador volta a escrever, o erro anterior desaparece.
    this.form.valueChanges.subscribe(() => this.limparErroServidor());
  }

  login() {
    if (this.loading) return;

    this.submitted = true;

    // Campos vazios: o aviso aparece em cada campo, através de `submitted`.
    if (this.form.invalid) return;

    this.limparErroServidor();
    this.loading = true;

    const payload = {
      username: this.form.value.username.trim(),
      password: this.form.value.password
    };

    this.auth.login(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const { texto, credenciais } = this.interpretarErro(err);
        this.serverError = texto;
        this.credentialsError = credenciais;
      }
    });
  }

  private limparErroServidor(): void {
    this.serverError = null;
    this.credentialsError = false;
  }

  /**
   * Converte a falha do pedido numa mensagem clara para o utilizador.
   *
   * Credenciais incorretas: 401, resposta com "Credenciais", ou 500
   * (o backend atual devolve 500 quando o login falha; o ideal é passar a devolver 401).
   */
  private interpretarErro(err: any): { texto: string; credenciais: boolean } {
    const status: number = err?.status ?? 0;
    const doServidor = this.mensagemSegura(err);

    const credenciais =
      status === 401 ||
      status === 500 ||
      /credenciais/i.test(doServidor ?? '');

    if (credenciais) {
      return { texto: 'Username ou password incorretos', credenciais: true };
    }

    // Sem resposta do servidor: rede em baixo, CORS ou tempo esgotado.
    if (status === 0) {
      const esgotado = err?.name === 'TimeoutError';
      return {
        texto: esgotado
          ? 'O servidor demorou demasiado a responder. Tente novamente.'
          : 'Sem ligação ao servidor. Verifique a sua ligação e tente novamente.',
        credenciais: false
      };
    }

    switch (status) {
      case 400:
        return { texto: doServidor ?? 'Pedido inválido. Verifique os dados e tente novamente.', credenciais: false };
      case 403:
        return { texto: doServidor ?? 'Esta conta não tem permissão para aceder.', credenciais: false };
      case 423:
        return { texto: doServidor ?? 'Conta bloqueada. Contacte o administrador.', credenciais: false };
      case 429:
        return { texto: 'Demasiadas tentativas. Aguarde um momento e tente novamente.', credenciais: false };
      case 502:
      case 503:
      case 504:
        return { texto: 'O servidor está indisponível de momento. Tente novamente dentro de instantes.', credenciais: false };
      default:
        return { texto: 'Ocorreu um erro inesperado. Tente novamente.', credenciais: false };
    }
  }

  /**
   * Devolve a mensagem do servidor só se parecer escrita para o utilizador.
   * Rejeita HTML, JSON em bruto e mensagens técnicas (stack traces, exceções).
   */
  private mensagemSegura(err: any): string | null {
    const corpo = err?.error;
    const bruta = typeof corpo === 'string' ? corpo : (corpo?.message ?? corpo?.error);
    if (typeof bruta !== 'string') return null;

    const texto = bruta.trim();
    if (!texto || texto.length > 140) return null;
    if (/^[{[]/.test(texto) || /[<>]/.test(texto)) return null;
    if (/exception|stack|\bat\s+\S+\(|internal server error/i.test(texto)) return null;
    return texto;
  }

}
