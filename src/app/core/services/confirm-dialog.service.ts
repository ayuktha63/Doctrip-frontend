import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  body: string;
  actionLabel: string;
  accent: string;
  tint: string;
  onConfirm: () => void;
}

/** Mirrors the reference mockup's single activate/deactivate confirm modal — one at a time, not a stack. */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();

  open(request: ConfirmRequest): void {
    this._request.set(request);
  }

  confirm(): void {
    const req = this._request();
    this._request.set(null);
    req?.onConfirm();
  }

  close(): void {
    this._request.set(null);
  }
}
