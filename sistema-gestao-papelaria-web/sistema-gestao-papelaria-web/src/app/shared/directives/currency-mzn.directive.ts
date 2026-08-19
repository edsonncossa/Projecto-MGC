import { Directive, ElementRef, HostListener, OnInit, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[currencyMzn]',
  standalone: true
})
export class CurrencyMznDirective implements OnInit {

  private _el: HTMLInputElement;

  constructor(
    private elementRef: ElementRef,
    @Optional() @Self() private ngControl?: NgControl
  ) {
    this._el = this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    // Formata valor inicial se houver
    if (this._el.value) {
      this.formatValue(this._el.value);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    // Remove tudo que não for dígito
    let value = this._el.value.replace(/\D/g, '');

    // Converte para centavos → reais (divide por 100)
    if (value) {
      const numericValue = parseFloat(value) / 100;

      // Formata para pt-MZ: 1.000,00
      const formatted = numericValue.toLocaleString('pt-MZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      this._el.value = formatted;
    }

    // Atualiza o valor numérico no FormControl
    this.updateFormControl(value ? parseFloat(value) / 100 : null);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    // Garante formatação correta ao perder o foco
    if (this._el.value) {
      this.formatValue(this._el.value);
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(event: Event): void {
    // Seleciona todo o texto ao focar para facilitar edição
    setTimeout(() => this._el.select(), 0);
  }

  private formatValue(value: string): void {
    // Remove não-dígitos
    let digits = value.replace(/\D/g, '');

    if (!digits) {
      this._el.value = '';
      this.updateFormControl(null);
      return;
    }

    // Converte para número e formata
    const numericValue = parseFloat(digits) / 100;
    this._el.value = numericValue.toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    this.updateFormControl(numericValue);
  }

  private updateFormControl(value: number | null): void {
    // Atualiza o FormControl com o valor numérico puro
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(value, { emitEvent: false });
    }
  }
}
