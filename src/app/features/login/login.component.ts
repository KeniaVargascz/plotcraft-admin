import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { COUNTRY_CODES } from '../../core/constants/country-codes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  styles: [`
    :host {
      // Scope dark Material overrides to login only
      --mdc-outlined-text-field-outline-color: var(--login-border);
      --mdc-outlined-text-field-hover-outline-color: var(--login-border-hover);
      --mdc-outlined-text-field-focus-outline-color: var(--admin-accent);
      --mdc-outlined-text-field-label-text-color: var(--login-text-secondary);
      --mdc-outlined-text-field-focus-label-text-color: var(--admin-accent);
      --mdc-outlined-text-field-input-text-color: var(--login-text);
      --mdc-outlined-text-field-caret-color: var(--admin-accent);
      --mat-select-trigger-text-color: var(--login-text);
      --mat-select-enabled-arrow-color: var(--login-text-secondary);
      --mat-option-label-text-color: var(--admin-text);
    }

    .login-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: var(--login-bg);
      padding: 1rem;
    }

    .login-card {
      width: min(460px, 92vw);
      padding: 2.5rem 2rem;
      border-radius: 1.25rem;
      background: var(--login-surface);
      border: 1px solid var(--login-border);
      overflow: hidden;
    }

    .logo {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--admin-accent);
      margin-bottom: 0.25rem;
    }

    .logo-sub {
      text-align: center;
      font-size: 0.8rem;
      color: var(--login-text-secondary);
      margin-bottom: 2rem;
      letter-spacing: 0.03em;
    }

    .form-stack { display: grid; gap: 1rem; }

    .error-msg {
      color: #ef5350;
      font-size: 0.85rem;
      text-align: center;
      margin-top: 0.25rem;
      padding: 0.5rem;
      background: rgba(239,83,80,0.08);
      border-radius: 0.5rem;
    }

    mat-form-field { width: 100%; }

    .submit-btn {
      width: 100%;
      height: 46px;
      background: var(--admin-accent) !important;
      color: var(--login-surface) !important;
      font-weight: 600;
      font-size: 0.95rem;
      border-radius: 0.75rem;
      letter-spacing: 0.02em;
      transition: background 0.15s;
    }
    .submit-btn:hover:not([disabled]) {
      background: var(--admin-accent-hover) !important;
    }

    .info-text {
      text-align: center;
      color: var(--login-text-secondary);
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }

    .back-link {
      text-align: center;
      margin-top: 1rem;
    }
    .back-link a {
      color: var(--login-text-secondary);
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.15s;
    }
    .back-link a:hover { color: var(--login-text); }

    .forgot-link { text-align: center; margin-top: 0.75rem; }
    .forgot-link a {
      color: var(--admin-accent);
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: none;
    }
    .forgot-link a:hover { text-decoration: underline; }

    .qr-container {
      text-align: center;
      margin: 0.75rem 0;
      padding: 1rem;
      background: #ffffff;
      border-radius: 0.75rem;
      display: inline-block;
      width: 100%;
    }
    .qr-container img {
      max-width: 160px;
      width: 100%;
      border-radius: 0.25rem;
    }

    .qr-hint {
      font-size: 0.78rem;
      color: var(--login-text-secondary);
      text-align: center;
      margin-bottom: 0.75rem;
    }

    .channel-toggle {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .channel-btn {
      padding: 0.5rem 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--login-border);
      background: transparent;
      color: var(--login-text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
      transition: all 0.15s;
    }
    .channel-btn:hover {
      border-color: var(--login-border-hover);
      color: var(--login-text);
    }
    .channel-btn.active {
      border-color: var(--admin-accent);
      color: var(--admin-accent);
      background: var(--admin-accent-bg);
    }

    .success-msg {
      color: #66bb6a;
      font-size: 0.85rem;
      text-align: center;
      margin-top: 0.25rem;
      padding: 0.5rem;
      background: rgba(102,187,106,0.08);
      border-radius: 0.5rem;
    }

    .phone-row {
      display: flex;
      gap: 0.5rem;
    }
    .phone-row .country-code {
      width: 145px;
      flex-shrink: 0;
    }
    .phone-row .local-number { flex: 1; min-width: 0; }

    .divider {
      height: 1px;
      background: var(--login-border);
      margin: 0.25rem 0;
    }

    .step-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--admin-accent);
      background: var(--admin-accent-bg);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      margin: 0 auto 1rem;
      width: fit-content;
    }
  `],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">PlotCraft</div>
        <div class="logo-sub">Panel de Administracion</div>

        @if (step() === 'login') {
          <form class="form-stack" (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Contrasena</mat-label>
              <input matInput [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password" name="password" required />
              <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Iniciar sesion }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="forgot-link">
              <a (click)="step.set('forgot')">Olvide mi contrasena</a>
            </div>
          </form>

        } @else if (step() === 'forgot') {
          <form class="form-stack" (ngSubmit)="onForgotPassword()">
            <p class="info-text">Ingresa tu email de administrador para recibir un codigo de recuperacion</p>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="forgotEmail" name="forgotEmail" required />
            </mat-form-field>
            <div class="channel-toggle">
              <button type="button" class="channel-btn" [class.active]="forgotChannel() === 'sms'" (click)="forgotChannel.set('sms')">SMS</button>
              <button type="button" class="channel-btn" [class.active]="forgotChannel() === 'whatsapp'" (click)="forgotChannel.set('whatsapp')">WhatsApp</button>
            </div>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Enviar codigo }
            </button>
            @if (forgotSent()) { <p class="success-msg">Si la cuenta existe, se envio un codigo a tu telefono</p> }
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'reset') {
          <form class="form-stack" (ngSubmit)="onResetPassword()">
            <p class="info-text">Ingresa el codigo recibido y tu nueva contrasena</p>
            <mat-form-field appearance="outline">
              <mat-label>Codigo OTP</mat-label>
              <input matInput [(ngModel)]="resetCode" name="resetCode" maxlength="6" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nueva contrasena</mat-label>
              <input matInput type="password" [(ngModel)]="resetNewPassword" name="resetNewPassword" required />
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Restablecer contrasena }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'tfa-verify') {
          <form class="form-stack" (ngSubmit)="onVerifyTfa()">
            <div class="step-badge"><mat-icon style="font-size:14px;width:14px;height:14px">lock</mat-icon> Verificacion 2FA</div>
            <p class="info-text">Ingresa el codigo de tu aplicacion de autenticacion</p>
            <mat-form-field appearance="outline">
              <mat-label>Codigo 2FA</mat-label>
              <input matInput type="text" [(ngModel)]="tfaCode" name="tfaCode" required
                maxlength="6" autocomplete="one-time-code" />
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Verificar }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'tfa-setup') {
          <form class="form-stack" (ngSubmit)="onSetupAndEnable()">
            <div class="step-badge"><mat-icon style="font-size:14px;width:14px;height:14px">security</mat-icon> Configuracion obligatoria</div>
            <p class="info-text">
              Escanea el codigo QR con tu app de autenticacion
              (Google Authenticator, Authy, etc.)
            </p>
            <div class="qr-container">
              <img [src]="setupQr()" alt="QR Code" />
            </div>
            <p class="qr-hint">Si no puedes escanear, ingresa la URL manualmente en tu app</p>
            <div class="divider"></div>
            <mat-form-field appearance="outline">
              <mat-label>Codigo de verificacion</mat-label>
              <input matInput type="text" [(ngModel)]="tfaCode" name="tfaCode" required
                maxlength="6" autocomplete="one-time-code" />
            </mat-form-field>
            <div class="phone-row">
              <mat-form-field appearance="outline" class="country-code">
                <mat-label>Lada</mat-label>
                <mat-select [(ngModel)]="setupCountryCode" name="countryCode">
                  @for (c of countryCodes; track c.code) {
                    <mat-option [value]="c.code">{{ c.flag }} {{ c.code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="local-number">
                <mat-label>Numero local</mat-label>
                <input matInput [(ngModel)]="setupPhoneLocal" name="phone" required
                  placeholder="1234567890" />
              </mat-form-field>
            </div>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || !setupPhoneLocal">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Activar 2FA e iniciar sesion }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  email = '';
  password = '';
  tfaCode = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);
  step = signal<'login' | 'tfa-verify' | 'tfa-setup' | 'forgot' | 'reset'>('login');
  setupQr = signal('');
  readonly countryCodes = COUNTRY_CODES;
  setupCountryCode = '+52';
  setupPhoneLocal = '';
  private tfaToken = '';

  onLogin() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.tfaRequired) {
          this.tfaToken = res.tfaToken;
          this.step.set('tfa-verify');
        } else if (res.tfaSetupRequired) {
          this.tfaToken = res.tfaToken;
          this.setupQr.set(res.qrDataUrl);
          this.step.set('tfa-setup');
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Error al iniciar sesion');
      },
    });
  }

  onVerifyTfa() {
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyTfa(this.tfaToken, this.tfaCode).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Codigo invalido');
      },
    });
  }

  onSetupAndEnable() {
    this.loading.set(true);
    this.error.set('');
    const phone = this.setupCountryCode + this.setupPhoneLocal.replace(/\D/g, '');
    this.auth.setupAndEnable(this.tfaToken, this.tfaCode, phone).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Codigo invalido');
      },
    });
  }

  // Forgot / Reset password
  forgotEmail = '';
  forgotChannel = signal<'sms' | 'whatsapp'>('sms');
  forgotSent = signal(false);
  resetCode = '';
  resetNewPassword = '';

  onForgotPassword() {
    this.loading.set(true);
    this.error.set('');
    this.forgotSent.set(false);

    this.http.post<any>(`${environment.apiUrl}/admin/auth/forgot-password`, {
      email: this.forgotEmail,
      channel: this.forgotChannel(),
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.forgotSent.set(true);
        setTimeout(() => this.step.set('reset'), 2000);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al enviar codigo');
      },
    });
  }

  onResetPassword() {
    this.loading.set(true);
    this.error.set('');

    this.http.post<any>(`${environment.apiUrl}/admin/auth/reset-password`, {
      email: this.forgotEmail,
      code: this.resetCode,
      newPassword: this.resetNewPassword,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.step.set('login');
        } else {
          this.error.set(res.error?.message || 'Error al restablecer');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Error al restablecer');
      },
    });
  }

  resetToLogin() {
    this.step.set('login');
    this.tfaCode = '';
    this.tfaToken = '';
    this.setupQr.set('');
    this.setupCountryCode = '+52';
    this.setupPhoneLocal = '';
    this.error.set('');
  }
}
