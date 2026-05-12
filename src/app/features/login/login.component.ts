import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
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
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  styles: [`
    .login-shell .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: rgba(255,255,255,0.15);
      --mdc-outlined-text-field-hover-outline-color: rgba(255,255,255,0.3);
      --mdc-outlined-text-field-focus-outline-color: #c9a84c;
      --mdc-outlined-text-field-label-text-color: rgba(255,255,255,0.55);
      --mdc-outlined-text-field-focus-label-text-color: #c9a84c;
      --mdc-outlined-text-field-input-text-color: #e8e8f0;
      --mdc-outlined-text-field-caret-color: #c9a84c;
      --mdc-outlined-text-field-disabled-input-text-color: rgba(255,255,255,0.35);
      --mdc-outlined-text-field-disabled-label-text-color: rgba(255,255,255,0.3);
      --mdc-outlined-text-field-container-shape: 0.75rem;
    }
    .login-shell .mat-mdc-select {
      --mat-select-enabled-trigger-text-color: #e8e8f0;
      --mat-select-trigger-text-color: #e8e8f0;
      --mat-select-placeholder-text-color: rgba(255,255,255,0.55);
      --mat-select-enabled-arrow-color: rgba(255,255,255,0.55);
      --mat-select-focused-arrow-color: #c9a84c;
    }
    .login-shell .mat-mdc-select-value-text {
      color: #e8e8f0 !important;
    }
    .login-shell .mat-mdc-select-trigger .mat-mdc-select-value {
      color: #e8e8f0 !important;
    }
    .login-shell .mat-mdc-icon-button {
      --mdc-icon-button-icon-color: rgba(255,255,255,0.55);
    }
    .login-shell .mdc-floating-label {
      color: rgba(255,255,255,0.55) !important;
    }
    .login-shell .mdc-text-field--focused .mdc-floating-label {
      color: #c9a84c !important;
    }
    .login-shell .mdc-notched-outline__leading,
    .login-shell .mdc-notched-outline__notch,
    .login-shell .mdc-notched-outline__trailing {
      border-color: rgba(255,255,255,0.15) !important;
    }
    .login-shell .mdc-notched-outline__leading {
      border-radius: 0.75rem 0 0 0.75rem !important;
      width: 0.75rem !important;
    }
    .login-shell .mdc-notched-outline__trailing {
      border-radius: 0 0.75rem 0.75rem 0 !important;
    }
    .login-shell .mdc-notched-outline__notch {
      border-left: none !important;
    }
    .login-shell .mdc-text-field--focused .mdc-notched-outline__leading,
    .login-shell .mdc-text-field--focused .mdc-notched-outline__notch,
    .login-shell .mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #c9a84c !important;
    }
    .login-shell .mat-mdc-input-element {
      color: #e8e8f0 !important;
    }
    .login-shell input:-webkit-autofill,
    .login-shell input:-webkit-autofill:hover,
    .login-shell input:-webkit-autofill:focus {
      -webkit-text-fill-color: #e8e8f0 !important;
      -webkit-box-shadow: 0 0 0 1000px #1a1a2e inset !important;
      box-shadow: 0 0 0 1000px #1a1a2e inset !important;
      transition: background-color 5000s ease-in-out 0s;
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

    .resend-link {
      text-align: center;
      margin-top: 0.5rem;
    }
    .resend-link a {
      color: var(--admin-accent);
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: none;
    }
    .resend-link a:hover { text-decoration: underline; }
    .resend-link a.disabled {
      color: var(--login-text-secondary);
      pointer-events: none;
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

        } @else if (step() === 'phone') {
          <form class="form-stack" (ngSubmit)="onRegisterPhone()">
            <div class="step-badge"><mat-icon style="font-size:14px;width:14px;height:14px">phone</mat-icon> Registro de telefono</div>
            <p class="info-text">Registra tu numero de telefono para recibir codigos de verificacion</p>
            <div class="phone-row">
              <mat-form-field appearance="outline" class="country-code">
                <mat-label>Lada</mat-label>
                <mat-select [(ngModel)]="phoneCountryCode" name="countryCode" panelClass="login-lada-panel">
                  @for (c of countryCodes; track c.code) {
                    <mat-option [value]="c.code">{{ c.flag }} {{ c.code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="local-number">
                <mat-label>Numero local</mat-label>
                <input matInput [(ngModel)]="phoneLocal" name="phone" required placeholder="1234567890" />
              </mat-form-field>
            </div>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || !phoneLocal">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Continuar }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'send-otp') {
          <form class="form-stack" (ngSubmit)="onSendOtp()">
            <div class="step-badge"><mat-icon style="font-size:14px;width:14px;height:14px">sms</mat-icon> Verificacion</div>
            <p class="info-text">Selecciona como recibir tu codigo de verificacion</p>
            <div class="channel-toggle">
              <button type="button" class="channel-btn" [class.active]="otpChannel() === 'sms'" (click)="otpChannel.set('sms')">SMS</button>
              <button type="button" class="channel-btn" [class.active]="otpChannel() === 'whatsapp'" (click)="otpChannel.set('whatsapp')">WhatsApp</button>
            </div>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Enviar codigo }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'otp') {
          <form class="form-stack" (ngSubmit)="onVerifyOtp()">
            <div class="step-badge"><mat-icon style="font-size:14px;width:14px;height:14px">lock</mat-icon> Codigo OTP</div>
            <p class="info-text">Ingresa el codigo de 6 digitos enviado a tu telefono</p>
            <mat-form-field appearance="outline">
              <mat-label>Codigo OTP</mat-label>
              <input matInput [(ngModel)]="otpCode" name="otpCode" required maxlength="6" autocomplete="one-time-code" />
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || otpCode.length < 6">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Verificar }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="resend-link">
              <a (click)="onResendOtp()" [class.disabled]="resendCooldown() > 0">
                @if (resendCooldown() > 0) {
                  Reenviar en {{ resendCooldown() }}s
                } @else {
                  Reenviar codigo
                }
              </a>
            </div>
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'forgot') {
          <form class="form-stack" (ngSubmit)="onForgotPassword()">
            <p class="info-text">Ingresa tu email de administrador para recibir un codigo de recuperacion por SMS, WhatsApp o correo electronico</p>
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
              <p class="success-msg">
                @if (forgotVia() === 'email') {
                  Se envio un codigo a tu correo electronico
                } @else {
                  Se envio un codigo a tu telefono
                }
              </p>
            }
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
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  // Login
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);
  step = signal<'login' | 'phone' | 'send-otp' | 'otp' | 'forgot' | 'reset'>('login');

  // Phone registration
  readonly countryCodes = COUNTRY_CODES;
  phoneCountryCode = '+52';
  phoneLocal = '';

  // OTP
  otpChannel = signal<'sms' | 'whatsapp'>('sms');
  otpCode = '';
  resendCooldown = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private tfaToken = '';

  // Forgot / Reset
  forgotEmail = '';
  forgotChannel = signal<'sms' | 'whatsapp'>('sms');
  forgotSent = signal(false);
  forgotVia = signal<'email' | 'phone' | 'unknown'>('unknown');
  resetCode = '';
  resetNewPassword = '';

  // Step 1: Login
  onLogin() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.tfaToken = res.tfaToken;
        if (res.phoneRequired) {
          this.step.set('phone');
        } else {
          this.step.set('send-otp');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Error al iniciar sesion');
      },
    });
  }

  // Step 2 (optional): Register phone
  onRegisterPhone() {
    this.loading.set(true);
    this.error.set('');
    const phone = this.phoneCountryCode + this.phoneLocal.replace(/\D/g, '');
    this.auth.registerPhone(this.tfaToken, phone).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('send-otp');
      },
      error: (err) => {
        this.loading.set(false);
        this.handleTokenError(err) || this.error.set(err?.error?.error?.message || 'Error al registrar telefono');
      },
    });
  }

  // Step 3: Send OTP
  onSendOtp() {
    this.loading.set(true);
    this.error.set('');
    this.auth.sendOtp(this.tfaToken, this.otpChannel()).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('otp');
        this.startResendCooldown();
      },
      error: (err) => {
        this.loading.set(false);
        this.handleTokenError(err) || this.error.set(err?.error?.error?.message || 'Error al enviar codigo');
      },
    });
  }

  // Step 4: Verify OTP
  onVerifyOtp() {
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyOtp(this.tfaToken, this.otpCode).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.handleTokenError(err) || this.error.set(err?.error?.error?.message || 'Codigo invalido');
      },
    });
  }

  onResendOtp() {
    if (this.resendCooldown() > 0) return;
    this.error.set('');
    this.auth.sendOtp(this.tfaToken, this.otpChannel()).subscribe({
      next: () => this.startResendCooldown(),
      error: (err) => {
        this.handleTokenError(err) || this.error.set(err?.error?.error?.message || 'Error al reenviar');
      },
    });
  }

  // Forgot password
  onForgotPassword() {
    this.loading.set(true);
    this.error.set('');
    this.forgotSent.set(false);

    this.http.post<any>(`${environment.apiUrl}/admin/auth/forgot-password`, {
      email: this.forgotEmail,
      channel: this.forgotChannel(),
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.forgotVia.set(res?.data?.via || 'unknown');
        this.forgotSent.set(true);
        setTimeout(() => this.step.set('reset'), 2500);
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
      next: () => {
        this.loading.set(false);
        this.step.set('login');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Error al restablecer');
      },
    });
  }

  resetToLogin() {
    this.step.set('login');
    this.tfaToken = '';
    this.otpCode = '';
    this.phoneLocal = '';
    this.phoneCountryCode = '+52';
    this.error.set('');
    this.clearResendTimer();
  }

  private handleTokenError(err: any): boolean {
    if (err?.error?.error?.code === 'TFA_TOKEN_INVALID') {
      this.error.set('La sesion expiro. Inicia sesion de nuevo.');
      setTimeout(() => this.resetToLogin(), 2000);
      return true;
    }
    return false;
  }

  private startResendCooldown() {
    this.resendCooldown.set(60);
    this.clearResendTimer();
    this.resendTimer = setInterval(() => {
      const val = this.resendCooldown() - 1;
      this.resendCooldown.set(val);
      if (val <= 0) this.clearResendTimer();
    }, 1000);
  }

  private clearResendTimer() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
