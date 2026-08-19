import { Directive, HostListener, ElementRef, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appPhoneMask]' // Seletor para usar no HTML
})
export class PhoneMaskDirective {

  constructor(
    private el: ElementRef,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    let value = event.target.value;

    // 1. Remove tudo que não for dígito
    value = value.replace(/\D/g, '');

    // 2. Limita a 9 dígitos (ex: 849353568)
    if (value.length > 9) {
      value = value.substring(0, 9);
    }

    // 3. Aplica a formatação visual (XX XXX XXXX)
    if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{4}).*/, '$1 $2 $3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{3}).*/, '$1 $2');
    }

    // 4. Atualiza o valor no input e no FormControl
    this.el.nativeElement.value = value;

    if (this.ngControl?.control) {
      // Dispara o evento de input manualmente para o Angular detectar a mudança
      this.ngControl.control.setValue(value, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: any): void {
    // Opcional: Validar se tem a quantidade correta de dígitos ao sair do campo
    const value = event.target.value.replace(/\D/g, '');
    if (value.length !== 9) {
      this.ngControl?.control?.setErrors({ invalidPhone: true });
    }
  }
}
