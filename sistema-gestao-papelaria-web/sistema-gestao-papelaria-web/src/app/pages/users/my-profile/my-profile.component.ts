import { Component } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '@app/services/auth.service';
import { SnackbarService } from '@app/services/snackbar.service';
import { ChangePasswordDTO } from '@app/shared/models/user';
import { User } from '../../../shared/models/user';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent {

  form!: FormGroup;
  isLoading = false;

  // Exibir usuário
  userName: string = '';
  userImage: string = '';
  defaultAvatar = 'assets/perfil.png';
  hideOld = true;
  hideNew = true;
  hideConfirm = true;
  user: User | null = null;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  imageBase64: string | null = null;


  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private snackbar: SnackbarService
  ) {

    this.form = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (user) {
      this.userName = user.fullName;
      this.userImage = user.image || 'assets/images/default-avatar.png';
    }

  }

  // Valida se a nova senha e confirmação coincidem
  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  // Envia a alteração de senha
  changePassword() {
    if (this.form.invalid) return;

    const dto: ChangePasswordDTO = {
      username: this.auth.getUser()?.userName || '',
      oldPassword: this.form.value.oldPassword,
      newPassword: this.form.value.newPassword
    };

    this.isLoading = true;
    this.auth.changePassword(dto).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackbar.success('Senha alterada com sucesso!');
      },
      error: (err) => {
        this.isLoading = false;
        this.snackbar.error(err.error || 'Erro ao alterar a senha');
      }
    });
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    try {
      // Opções de compressão
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true
      };

      // comprime a imagem
      const compressedFile = await imageCompression(file, options);

      this.selectedFile = compressedFile;

      const reader = new FileReader();

      reader.onload = () => {
        this.imagePreview = reader.result;           // preview
        this.imageBase64 = reader.result as string;  // base64 leve
      };

      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
    }
  }

  getImage(): string | ArrayBuffer {

    const userImage = this.auth.getUser()?.image;
    if (this.imagePreview != null) {
      return this.imagePreview
    }
    // Se userImage existir e não for vazio, retorna, senão retorna imagem padrão
    return userImage && userImage.trim() !== '' ? userImage : this.defaultAvatar;
  }

  updateImage() {
    if (this.imagePreview != null) {

      const dto: User = {
      userName: this.auth.getUser()?.userName || '',
      fullName: this.auth.getUser()?.fullName || '',
      image: this.imageBase64|| ''
    };
      this.auth.updateImage(dto).subscribe({
        next:(result) => {
        this.auth.getUser()!.image = result.image; // Atualiza a imagem do usuário no AuthService
          this.snackbar.success('Sucesso')
        },
        error: (error) =>{
          this.snackbar.error('Erro ao salvar imagem');
        }
      });

    } else {
      this.snackbar.error("Nao foi carregada nenhuma imagem");
    }
  }
}

