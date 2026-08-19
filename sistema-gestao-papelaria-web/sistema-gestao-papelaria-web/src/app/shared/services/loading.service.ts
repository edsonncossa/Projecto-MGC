import { Injectable } from '@angular/core';
import { BehaviorSubject, delay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCount = 0;

  // Observable para o componente ouvir
  loading$ = this.loadingSubject.asObservable().pipe(delay(0));

  show(): void {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.setLoading(true);
    }
  }

  hide(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--;
    }

    if (this.loadingCount === 0) {
      this.setLoading(false);
    }
  }

  // Reset forçado (emergência)
  reset(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  private setLoading(state: boolean): void {
    this.loadingSubject.next(state);
  }
}
