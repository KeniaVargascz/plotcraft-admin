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
    .login-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #1a1a2e;
    }
    .login-card {
      width: min(420px, 90vw);
      padding: 2.5rem;
      border-radius: 1.25rem;
      background: #16213e;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .logo {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #c9a84c;
      margin-bottom: 2rem;
    }
    .form-stack { display: grid; gap: 1.25rem; }
    .error-msg {
      color: #ef5350;
      font-size: 0.85rem;
      text-align: center;
      margin-top: 0.5rem;
    }
    mat-form-field { width: 100%; }
    .submit-btn {
      width: 100%;
      height: 44px;
      background: #c9a84c !important;
      color: #1a1a2e !important;
      font-weight: 600;
      border-radius: 0.75rem;
    }
    .tfa-info {
      text-align: center;
      color: #a0a0b8;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .back-link {
      text-align: center;
      margin-top: 0.75rem;
    }
    .back-link a {
      color: #a0a0b8;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .qr-container { text-align: center; margin: 1rem 0; }
    .qr-container img { max-width: 180px; border-radius: 0.5rem; }
    .secret-code {
      font-family: monospace; font-size: 0.8rem; background: rgba(255,255,255,0.05);
      color: #c9a84c; padding: 0.5rem; border-radius: 0.5rem; text-align: center;
      word-break: break-all; margin: 0.75rem 0;
    }
    .setup-info { color: #a0a0b8; font-size: 0.85rem; text-align: center; margin-bottom: 0.75rem; }
    .forgot-link { text-align: center; margin-top: 0.75rem; }
    .forgot-link a { color: #c9a84c; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }
    .channel-toggle {
      display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem;
    }
    .channel-btn {
      padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.15);
      background: transparent; color: #a0a0b8; cursor: pointer; font-size: 0.85rem;
      transition: all 0.15s;
    }
    .channel-btn.active { border-color: #c9a84c; color: #c9a84c; background: rgba(201,168,76,0.1); }
    .success-msg { color: #4caf50; font-size: 0.85rem; text-align: center; margin-top: 0.5rem; }
    .phone-row { display: flex; gap: 0.75rem; }
    .phone-row .country-code { width: 180px; flex-shrink: 0; }
    .phone-row .local-number { flex: 1; }
    .phone-row mat-select { color: #e0e0e0; }
    ::ng-deep .phone-row .mat-mdc-select-panel { max-height: 250px; }
  `],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">PlotCraft Admin</div>

        @if (step() === 'login') {
          <!-- Step 1: Email + Password -->
          <form class="form-stack" (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password" name="password" required />
              <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Iniciar sesion
              }
            </button>
            @if (error()) {
              <p class="error-msg">{{ error() }}</p>
            }
            <div class="forgot-link">
              <a (click)="step.set('forgot')">Olvide mi contrasena</a>
            </div>
          </form>
        } @else if (step() === 'forgot') {
          <!-- Forgot password: send OTP via SMS/WhatsApp -->
          <form class="form-stack" (ngSubmit)="onForgotPassword()">
            <p class="tfa-info">Ingresa tu email de administrador para recibir un codigo de recuperacion</p>
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
            @if (forgotSent()) {
              <p class="success-msg">Si la cuenta existe, se envio un codigo a tu telefono</p>
            }
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>
        } @else if (step() === 'reset') {
          <!-- Reset password with OTP -->
          <form class="form-stack" (ngSubmit)="onResetPassword()">
            <p class="tfa-info">Ingresa el codigo recibido y tu nueva contrasena</p>
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
          <!-- Step 2a: Verify existing 2FA -->
          <form class="form-stack" (ngSubmit)="onVerifyTfa()">
            <p class="tfa-info">Ingresa el codigo de tu aplicacion de autenticacion</p>
            <mat-form-field appearance="outline">
              <mat-label>Codigo 2FA</mat-label>
              <input matInput type="text" [(ngModel)]="tfaCode" name="tfaCode" required
                maxlength="6" autocomplete="one-time-code" />
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Verificar
              }
            </button>
            @if (error()) {
              <p class="error-msg">{{ error() }}</p>
            }
            <div class="back-link">
              <a (click)="resetToLogin()">Volver al login</a>
            </div>
          </form>
        } @else if (step() === 'tfa-setup') {
          <!-- Step 2b: Mandatory 2FA + phone setup -->
          <form class="form-stack" (ngSubmit)="onSetupAndEnable()">
            <p class="setup-info">
              La autenticacion de dos factores es obligatoria.
              Escanea el QR con tu app (Google Authenticator, Authy, etc.)
            </p>
            <div class="qr-container">
              <img [src]="setupQr()" alt="QR" />
            </div>
            <p style="font-size:0.8rem;color:#a0a0b8;text-align:center">Si no puedes escanear el QR, ingresa la URL manualmente en tu app</p>
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
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Activar 2FA e iniciar sesion
              }
            </button>
            @if (error()) {
              <p class="error-msg">{{ error() }}</p>
            }
            <div class="back-link">
              <a (click)="resetToLogin()">Volver al login</a>
            </div>
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
