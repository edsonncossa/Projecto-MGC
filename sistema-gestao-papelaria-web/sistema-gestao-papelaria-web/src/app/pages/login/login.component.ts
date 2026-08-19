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
  error: string | null = null;
  submitted = false; // <-- Variável para controlar a tentativa de submissão

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
  }

  login() {
    this.submitted = true; // Activa a exibição de validações apenas ao clicar em Entrar

    if (this.form.invalid) {
      const usernameInvalid = this.form.get('username')?.invalid;
      const passwordInvalid = this.form.get('password')?.invalid;

      if (usernameInvalid && passwordInvalid) {
        this.error = 'Insira o username e a password.';
      } else if (usernameInvalid) {
        this.error = 'Insira o username.';
      } else if (passwordInvalid) {
        this.error = 'Insira a password.';
      }
      return;
    }

    this.error = null;

    const payload = {
      username: this.form.value.username.trim(),
      password: this.form.value.password
    };

    this.auth.login(payload).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const isAuthError = err.status === 401 || 
                            (err.error && typeof err.error === 'string' && err.error.includes('Credenciais')) ||
                            (err.error?.message && err.error.message.includes('Credenciais')) ||
                            err.status === 500;

        if (isAuthError) {
          this.error = 'Username ou Password incorreto!'; 
        } else {
          this.error = 'Ocorreu um erro ao conectar ao servidor.';
        }

        try {
          this.snackbar.error(this.error);
        } catch (e) {
          console.warn('Snackbar falhou ao exibir:', e);
        }
      }
    });
  }

}