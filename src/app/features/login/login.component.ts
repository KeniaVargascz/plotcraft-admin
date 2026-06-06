import { Component, DestroyRef, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/services/auth.service';
import { COUNTRY_CODES } from '../../core/constants/country-codes';

@Component({
  selector: 'app-login',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  styleUrl: './login.component.scss',
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">PlotCraft</div>
        <div class="logo-sub">Panel de Administracion</div>

        @if (step() === 'login') {
          <form class="form-stack" [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              @if (loginForm.controls.email.touched && loginForm.controls.email.hasError('required')) {
                <mat-error>El email es obligatorio</mat-error>
              } @else if (loginForm.controls.email.touched && loginForm.controls.email.hasError('email')) {
                <mat-error>Ingresa un email valido</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Contrasena</mat-label>
              <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password" />
              <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.controls.password.touched && loginForm.controls.password.hasError('required')) {
                <mat-error>La contrasena es obligatoria</mat-error>
              }
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || loginForm.invalid || rateLimitCountdown() > 0">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Iniciar sesion }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            <div class="forgot-link">
              <a (click)="step.set('forgot')">Olvide mi contrasena</a>
            </div>
          </form>

        } @else if (step() === 'phone') {
          <form class="form-stack" [formGroup]="phoneForm" (ngSubmit)="onRegisterPhone()">
            <div class="step-badge"><mat-icon style="font-size:14px;width:14px;height:14px">phone</mat-icon> Registro de telefono</div>
            <p class="info-text">Registra tu numero de telefono para recibir codigos de verificacion</p>
            <div class="phone-row">
              <mat-form-field appearance="outline" class="country-code">
                <mat-label>Lada</mat-label>
                <mat-select formControlName="countryCode" panelClass="login-lada-panel">
                  @for (c of countryCodes; track c.code) {
                    <mat-option [value]="c.code">{{ c.flag }} {{ c.code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="local-number">
                <mat-label>Numero local</mat-label>
                <input matInput formControlName="phoneLocal" placeholder="1234567890" />
                @if (phoneForm.controls.phoneLocal.touched && phoneForm.controls.phoneLocal.hasError('required')) {
                  <mat-error>El numero es obligatorio</mat-error>
                } @else if (phoneForm.controls.phoneLocal.touched && phoneForm.controls.phoneLocal.hasError('pattern')) {
                  <mat-error>Solo digitos (7-15 caracteres)</mat-error>
                }
              </mat-form-field>
            </div>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || phoneForm.invalid">
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
              @if (allowedChannels().includes('sms')) {
                <button type="button" class="channel-btn" [class.active]="otpChannel() === 'sms'" (click)="otpChannel.set('sms')">SMS</button>
              }
              @if (allowedChannels().includes('whatsapp')) {
                <button type="button" class="channel-btn" [class.active]="otpChannel() === 'whatsapp'" (click)="otpChannel.set('whatsapp')">WhatsApp</button>
              }
              @if (allowedChannels().includes('email')) {
                <button type="button" class="channel-btn" [class.active]="otpChannel() === 'email'" (click)="otpChannel.set('email')">Email</button>
              }
              @if (allowedChannels().includes('totp') && tfaEnabled()) {
                <button type="button" class="channel-btn" [class.active]="otpChannel() === 'totp'" (click)="otpChannel.set('totp')">Authenticator</button>
              }
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
            <p class="info-text">
              @if (otpChannel() === 'totp') {
                Ingresa el codigo de 6 digitos de tu app de autenticacion
              } @else {
                Ingresa el codigo de 6 digitos enviado a tu {{ otpChannel() === 'email' ? 'correo electronico' : 'telefono' }}
              }
            </p>
            <mat-form-field appearance="outline">
              <mat-label>Codigo OTP</mat-label>
              <input matInput [(ngModel)]="otpCode" name="otpCode" required maxlength="6" autocomplete="one-time-code" />
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || otpCode.length < 6">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Verificar }
            </button>
            @if (error()) { <p class="error-msg">{{ error() }}</p> }
            @if (otpChannel() !== 'totp') {
              <div class="resend-link">
                <a (click)="onResendOtp()" [class.disabled]="resendCooldown() > 0">
                  @if (resendCooldown() > 0) {
                    Reenviar en {{ resendCooldown() }}s
                  } @else {
                    Reenviar codigo
                  }
                </a>
              </div>
            }
            <div class="back-link"><a (click)="resetToLogin()">Volver al login</a></div>
          </form>

        } @else if (step() === 'forgot') {
          <form class="form-stack" [formGroup]="forgotForm" (ngSubmit)="onForgotPassword()">
            <p class="info-text">Ingresa tu email de administrador para recibir un codigo de recuperacion por SMS, WhatsApp o correo electronico</p>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              @if (forgotForm.controls.email.touched && forgotForm.controls.email.hasError('required')) {
                <mat-error>El email es obligatorio</mat-error>
              } @else if (forgotForm.controls.email.touched && forgotForm.controls.email.hasError('email')) {
                <mat-error>Ingresa un email valido</mat-error>
              }
            </mat-form-field>
            <div class="channel-toggle">
              <button type="button" class="channel-btn" [class.active]="forgotChannel() === 'sms'" (click)="forgotChannel.set('sms')">SMS</button>
              <button type="button" class="channel-btn" [class.active]="forgotChannel() === 'whatsapp'" (click)="forgotChannel.set('whatsapp')">WhatsApp</button>
            </div>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || forgotForm.invalid">
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
          <form class="form-stack" [formGroup]="resetForm" (ngSubmit)="onResetPassword()">
            <p class="info-text">Ingresa el codigo recibido y tu nueva contrasena</p>
            <mat-form-field appearance="outline">
              <mat-label>Codigo OTP</mat-label>
              <input matInput formControlName="code" maxlength="6" />
              @if (resetForm.controls.code.touched && resetForm.controls.code.hasError('required')) {
                <mat-error>El codigo es obligatorio</mat-error>
              } @else if (resetForm.controls.code.touched && resetForm.controls.code.hasError('pattern')) {
                <mat-error>Debe ser un codigo de 6 digitos</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nueva contrasena</mat-label>
              <input matInput type="password" formControlName="newPassword" />
              @if (resetForm.controls.newPassword.touched && resetForm.controls.newPassword.hasError('required')) {
                <mat-error>La contrasena es obligatoria</mat-error>
              } @else if (resetForm.controls.newPassword.touched && resetForm.controls.newPassword.hasError('minlength')) {
                <mat-error>Minimo 8 caracteres</mat-error>
              } @else if (resetForm.controls.newPassword.touched && resetForm.controls.newPassword.hasError('pattern')) {
                <mat-error>Debe incluir mayuscula, minuscula, numero y caracter especial</mat-error>
              }
            </mat-form-field>
            <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || resetForm.invalid">
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
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearResendTimer();
      if (this.rateLimitTimer) { clearInterval(this.rateLimitTimer); this.rateLimitTimer = null; }
    });
  }

  loading = signal(false);
  error = signal('');
  showPass = signal(false);
  step = signal<'login' | 'phone' | 'send-otp' | 'otp' | 'forgot' | 'reset'>('login');
  rateLimitCountdown = signal(0);
  private rateLimitTimer: ReturnType<typeof setInterval> | null = null;

  // Reactive forms
  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly phoneForm = this.fb.nonNullable.group({
    countryCode: ['+52'],
    phoneLocal: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
  });

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/)]],
  });

  // Phone registration
  readonly countryCodes = COUNTRY_CODES;

  // OTP
  otpChannel = signal<'sms' | 'whatsapp' | 'email' | 'totp'>('sms');
  tfaEnabled = signal(false);
  allowedChannels = signal<string[]>(['sms', 'whatsapp', 'email']);
  otpCode = '';
  resendCooldown = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private readonly TFA_TOKEN_KEY = 'admin_tfa_token';

  private get tfaToken(): string {
    return sessionStorage.getItem(this.TFA_TOKEN_KEY) ?? '';
  }
  private set tfaToken(value: string) {
    if (value) {
      sessionStorage.setItem(this.TFA_TOKEN_KEY, value);
    } else {
      sessionStorage.removeItem(this.TFA_TOKEN_KEY);
    }
  }

  // Forgot / Reset
  forgotChannel = signal<'sms' | 'whatsapp'>('sms');
  forgotSent = signal(false);
  forgotVia = signal<'email' | 'phone' | 'unknown'>('unknown');

  // Step 1: Login
  onLogin() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.tfaToken = res.tfaToken;
        this.tfaEnabled.set(res.tfaEnabled);
        this.allowedChannels.set(res.allowedChannels);
        // Default to first allowed channel
        const defaultChannel = res.allowedChannels[0] as any;
        if (defaultChannel) this.otpChannel.set(defaultChannel);
        if (res.phoneRequired) {
          this.step.set('phone');
        } else {
          this.step.set('send-otp');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 429) {
          const retryAfter = parseInt(err.headers?.get?.('Retry-After') ?? '', 10);
          this.startRateLimitCountdown(retryAfter > 0 ? retryAfter : 60);
        } else {
          this.error.set(err?.error?.error?.message || 'Error al iniciar sesion');
        }
      },
    });
  }

  // Step 2 (optional): Register phone
  onRegisterPhone() {
    this.phoneForm.markAllAsTouched();
    if (this.phoneForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    const { countryCode, phoneLocal } = this.phoneForm.getRawValue();
    const phone = countryCode + phoneLocal.replace(/\D/g, '');
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
    this.auth.verifyOtp(this.tfaToken, this.otpCode, this.otpChannel()).subscribe({
      next: () => {
        this.loading.set(false);
        this.tfaToken = '';
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
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.forgotSent.set(false);
    const { email } = this.forgotForm.getRawValue();

    this.auth.forgotPassword(email, this.forgotChannel()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.forgotVia.set(res?.via ?? 'unknown');
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
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    const { code, newPassword } = this.resetForm.getRawValue();
    const { email } = this.forgotForm.getRawValue();

    this.auth.resetPassword(email, code, newPassword).subscribe({
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
    this.loginForm.reset();
    this.phoneForm.reset({ countryCode: '+52', phoneLocal: '' });
    this.forgotForm.reset();
    this.resetForm.reset();
    this.error.set('');
    this.forgotSent.set(false);
    this.forgotVia.set('unknown');
    this.rateLimitCountdown.set(0);
    if (this.rateLimitTimer) { clearInterval(this.rateLimitTimer); this.rateLimitTimer = null; }
    this.clearResendTimer();
  }

  private handleTokenError(err: any): boolean {
    if (err?.error?.error?.code === 'TFA_TOKEN_INVALID') {
      this.tfaToken = '';
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

  private startRateLimitCountdown(seconds: number) {
    this.rateLimitCountdown.set(seconds);
    this.error.set(`Demasiados intentos. Reintenta en ${seconds}s`);
    if (this.rateLimitTimer) clearInterval(this.rateLimitTimer);
    this.rateLimitTimer = setInterval(() => {
      const val = this.rateLimitCountdown() - 1;
      if (val <= 0) {
        this.rateLimitCountdown.set(0);
        this.error.set('');
        clearInterval(this.rateLimitTimer!);
        this.rateLimitTimer = null;
      } else {
        this.rateLimitCountdown.set(val);
        this.error.set(`Demasiados intentos. Reintenta en ${val}s`);
      }
    }, 1000);
  }
}
