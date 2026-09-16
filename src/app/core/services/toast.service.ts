import { Injectable, signal } from '@angular/core';

/**
 * Mirrors the reference mockup's single bottom-center toast (PatientPanel.dc.html's `flash()` /
 * `{{ toast }}` state) — one message at a time, not a stacking list.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _message = signal<string>('');
  readonly message = this._message.asReadonly();

  private timer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, durationMs = 2600): void {
    if (this.timer) clearTimeout(this.timer);
    this._message.set(message);
    this.timer = setTimeout(() => this._message.set(''), durationMs);
  }
}
