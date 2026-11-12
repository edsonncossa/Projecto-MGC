import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/services/auth.service';
import { Router } from '@angular/router';
import { SnackbarService } from '@app/services/snackbar.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  hidePassword = true;
  form: FormGroup;
  authError: string | null = null; // Erro de credenciais, mostrado junto aos campos
  submitted = false; // Controla a exibição das validações após tentativa de submissão
  loading = false;   // Estado de carregamento do botão
  year = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackbar: SnackbarService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Assim que o utilizador volta a escrever, o erro de credenciais desaparece.
    this.form.valueChanges.subscribe(() => {
      if (this.authError) this.authError = null;
    });
  }

  login() {
    if (this.loading) return;

    this.submitted = true;

    // As validações (campos vazios) aparecem em cada campo, através de `submitted`.
    if (this.form.invalid) return;

    this.authError = null;
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

        const isAuthError = err.status === 401 ||
                            (err.error && typeof err.error === 'string' && err.error.includes('Credenciais')) ||
                            (err.error?.message && err.error.message.includes('Credenciais')) ||
                            err.status === 500;

        if (isAuthError) {
          // Erro de credenciais: marca os dois campos e mostra a mensagem por baixo da password.
          this.authError = 'Username ou password incorretos';
          return;
        }

        // Falha de ligação: não pertence a nenhum campo, por isso fica só no snackbar.
        try {
          this.snackbar.error('Ocorreu um erro ao conectar ao servidor.');
        } catch (e) {
          console.warn('Snackbar falhou ao exibir:', e);
        }
      }
    });
  }

}
