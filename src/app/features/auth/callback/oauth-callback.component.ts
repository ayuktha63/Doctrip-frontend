import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Landing route for the OAuth2 redirect: Doctrip-backend's OAuth2LoginSuccessHandler redirects
 * the browser here with ?token=...&refreshToken=... (or ?error=...) once Google/Apple sign-in
 * completes.
 */
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `<div style="padding: 40px; text-align: center; color: #6B7280; font-size: 14px">Signing you in…</div>`,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      this.toast.show(error);
      this.router.navigate(['/auth']);
      return;
    }
    if (!token || !refreshToken) {
      this.toast.show('Authentication failed. Please try again.');
      this.router.navigate(['/auth']);
      return;
    }
    this.auth.setSessionFromOAuthCallback(token, refreshToken).subscribe({
      next: () => {
        this.toast.show('Signed in successfully.');
        this.router.navigate(['/home']);
      },
      error: () => {
        this.auth.clearSession();
        this.toast.show('Authentication failed. Please try again.');
        this.router.navigate(['/auth']);
      },
    });
  }
}
