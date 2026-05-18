import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { HttpApiService } from '../../core/services/http-api.service';
import { COUNTRY_CODES } from '../../core/constants/country-codes';

interface AppSetting {
  key: string;
  value: string;
}

interface SettingsForm {
  maxFailedAttempts: number;
  accessTokenTtl: number;
  refreshTokenTtl: number;
  discoveryTtl: number;
  searchTtl: number;
  defaultLimit: number;
  maxLimit: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  registrationCopyEnabled: boolean;
  bannerEnabled: boolean;
  bannerHtml: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatIconModule,
    MatSelectModule,
  ],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .section-card { border-radius: 1rem !important; }
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .section-title mat-icon { color: #c9a84c; }
    .fields { display: flex; flex-direction: column; gap: 0.75rem; }
    mat-form-field { width: 100%; }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
    .toggle-label { font-size: 0.9rem; color: #444; }
    .actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .save-btn { background-color: #c9a84c !important; color: #fff !important; }
    .loading { display: grid; place-items: center; padding: 4rem; }
    .tfa-section { margin-bottom: 2rem; }
    .tfa-card { border-radius: 1rem !important; max-width: 500px; }
    .tfa-status {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.9rem; margin-bottom: 1rem;
    }
    .tfa-status.enabled { color: #2e7d32; }
    .tfa-status.disabled { color: #888; }
    .qr-container { text-align: center; margin: 1rem 0; }
    .qr-container img { max-width: 200px; border-radius: 0.5rem; }
    .secret-code {
      font-family: monospace; font-size: 0.85rem; background: #f5f5f5;
      padding: 0.5rem 1rem; border-radius: 0.5rem; text-align: center;
      word-break: break-all; margin: 0.75rem 0;
    }
    .tfa-form { display: flex; gap: 0.75rem; align-items: flex-start; }
    .tfa-form mat-form-field { flex: 1; }
    .tfa-btn { height: 56px !important; }
    .phone-row { display: flex; gap: 0.75rem; align-items: flex-start; }
    .phone-row .country-code { width: 200px; flex-shrink: 0; }
    .phone-row .local-number { flex: 1; }
    .banner-textarea { width: 100%; min-height: 120px; font-family: monospace; font-size: 0.85rem; }
    .banner-preview {
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px dashed #c9a84c;
      border-radius: 0.5rem;
      background: #fffdf5;
      font-size: 0.88rem;
    }
    .preview-label { font-size: 0.75rem; color: #888; margin-bottom: 0.25rem; }
    .hint-text { font-size: 0.75rem; color: #999; font-style: italic; margin-top: -0.25rem; }
  `],
  template: `
    <h1>Configuracion de la Plataforma</h1>

    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="settings-grid">
        <!-- Auth Section -->
        <mat-card class="section-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>security</mat-icon> Autenticacion</div>
            <div class="fields">
              <mat-form-field appearance="outline">
                <mat-label>Max intentos fallidos</mat-label>
                <input matInput type="number" [(ngModel)]="form.maxFailedAttempts">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Access Token TTL (segundos)</mat-label>
                <input matInput type="number" [(ngModel)]="form.accessTokenTtl">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Refresh Token TTL (segundos)</mat-label>
                <input matInput type="number" [(ngModel)]="form.refreshTokenTtl">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Cache Section -->
        <mat-card class="section-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>cached</mat-icon> Cache</div>
            <div class="fields">
              <mat-form-field appearance="outline">
                <mat-label>Discovery TTL (segundos)</mat-label>
                <input matInput type="number" [(ngModel)]="form.discoveryTtl">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Search TTL (segundos)</mat-label>
                <input matInput type="number" [(ngModel)]="form.searchTtl">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pagination Section -->
        <mat-card class="section-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>view_list</mat-icon> Paginacion</div>
            <div class="fields">
              <mat-form-field appearance="outline">
                <mat-label>Limite por defecto</mat-label>
                <input matInput type="number" [(ngModel)]="form.defaultLimit">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Limite maximo</mat-label>
                <input matInput type="number" [(ngModel)]="form.maxLimit">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Platform Section -->
        <mat-card class="section-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>tune</mat-icon> Plataforma</div>
            <div class="fields">
              <div class="toggle-row">
                <span class="toggle-label">Modo mantenimiento</span>
                <mat-slide-toggle [(ngModel)]="form.maintenanceMode" />
              </div>
              <div class="toggle-row">
                <span class="toggle-label">Registro habilitado</span>
                <mat-slide-toggle [(ngModel)]="form.registrationEnabled" />
              </div>
              <div class="toggle-row">
                <span class="toggle-label">Copia de verificacion a correo admin</span>
                <mat-slide-toggle [(ngModel)]="form.registrationCopyEnabled" />
              </div>
              <div class="hint-text">El correo destino solo se configura desde la base de datos</div>
            </div>
          </mat-card-content>
        </mat-card>
        <!-- Banner Section -->
        <mat-card class="section-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>campaign</mat-icon> Banner Informativo</div>
            <div class="fields">
              <div class="toggle-row">
                <span class="toggle-label">Banner activo</span>
                <mat-slide-toggle [(ngModel)]="form.bannerEnabled" />
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Contenido HTML</mat-label>
                <textarea matInput class="banner-textarea" [(ngModel)]="form.bannerHtml"
                  placeholder='Ej: <b>Mantenimiento programado</b> el viernes 25 de abril.'></textarea>
              </mat-form-field>
              @if (form.bannerHtml) {
                <div class="preview-label">Vista previa:</div>
                <div class="banner-preview" [innerHTML]="sanitizedBanner()"></div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Change Password Section -->
      <div class="tfa-section">
        <mat-card class="tfa-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>lock</mat-icon> Cambiar contrasena</div>
            <div class="fields">
              <mat-form-field appearance="outline">
                <mat-label>Contrasena actual</mat-label>
                <input matInput type="password" [(ngModel)]="changeForm.currentPassword" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nueva contrasena</mat-label>
                <input matInput type="password" [(ngModel)]="changeForm.newPassword" />
              </mat-form-field>

              @if (!changeCodeSent()) {
                <div class="section-title" style="font-size:0.85rem;margin-top:0.5rem">Enviar codigo de verificacion via:</div>
                <div class="channel-toggle" style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
                  <button mat-stroked-button (click)="sendChangeCode('email')" [disabled]="changeSaving()">Email</button>
                  <button mat-stroked-button (click)="sendChangeCode('sms')" [disabled]="changeSaving()">SMS</button>
                  <button mat-stroked-button (click)="sendChangeCode('whatsapp')" [disabled]="changeSaving()">WhatsApp</button>
                  @if (tfaEnabled()) {
                    <button mat-stroked-button (click)="sendChangeCode('totp')" [disabled]="changeSaving()">Authenticator</button>
                  }
                </div>
              } @else {
                <mat-form-field appearance="outline">
                  <mat-label>Codigo de verificacion</mat-label>
                  <input matInput [(ngModel)]="changeForm.code" maxlength="6" />
                </mat-form-field>
                <button mat-flat-button class="save-btn" (click)="changePassword()" [disabled]="changeSaving()">
                  @if (changeSaving()) { <mat-spinner diameter="20" /> } @else { Cambiar contrasena }
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Phone Section -->
      <div class="tfa-section">
        <mat-card class="tfa-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>phone</mat-icon> Telefono (para recuperar contrasena)</div>
            <div class="phone-row">
              <mat-form-field appearance="outline" class="country-code">
                <mat-label>Lada</mat-label>
                <mat-select [(ngModel)]="phoneCountryCode">
                  @for (c of countryCodes; track c.code) {
                    <mat-option [value]="c.code">{{ c.flag }} {{ c.code }} {{ c.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="local-number">
                <mat-label>Numero local</mat-label>
                <input matInput [(ngModel)]="phoneLocal" placeholder="1234567890" />
              </mat-form-field>
            </div>
            <div class="tfa-form">
              <mat-form-field appearance="outline">
                <mat-label>Codigo 2FA para confirmar</mat-label>
                <input matInput [(ngModel)]="phoneTfaCode" maxlength="6" />
              </mat-form-field>
              <button mat-flat-button class="save-btn tfa-btn" (click)="updatePhone()" [disabled]="phoneSaving()">
                Guardar
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 2FA Section -->
      <div class="tfa-section">
        <mat-card class="tfa-card">
          <mat-card-content>
            <div class="section-title"><mat-icon>security</mat-icon> Autenticacion de dos factores (2FA)</div>

            <div class="tfa-status" [class.enabled]="tfaEnabled()" [class.disabled]="!tfaEnabled()">
              <mat-icon>{{ tfaEnabled() ? 'verified_user' : 'shield' }}</mat-icon>
              {{ tfaEnabled() ? '2FA activado' : '2FA desactivado' }}
            </div>

            @if (!tfaEnabled()) {
              @if (!tfaSetupData()) {
                <button mat-stroked-button (click)="startTfaSetup()">
                  <mat-icon>qr_code_2</mat-icon> Configurar 2FA
                </button>
              } @else {
                <p style="font-size:0.85rem;color:#666;margin-bottom:0.75rem">
                  Escanea el codigo QR con tu app de autenticacion (Google Authenticator, Authy, etc.)
                </p>
                <div class="qr-container">
                  <img [src]="tfaSetupData()!.qrDataUrl" alt="QR Code" />
                </div>
                <div class="tfa-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Codigo de verificacion</mat-label>
                    <input matInput [(ngModel)]="tfaVerifyCode" maxlength="6" />
                  </mat-form-field>
                  <button mat-flat-button class="save-btn tfa-btn" (click)="enableTfa()" [disabled]="tfaSaving()">
                    Activar
                  </button>
                </div>
              }
            } @else {
              <div class="tfa-form">
                <mat-form-field appearance="outline">
                  <mat-label>Codigo para desactivar</mat-label>
                  <input matInput [(ngModel)]="tfaDisableCode" maxlength="6" />
                </mat-form-field>
                <button mat-stroked-button color="warn" class="tfa-btn" (click)="disableTfa()" [disabled]="tfaSaving()">
                  Desactivar 2FA
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <div class="actions">
        <button mat-raised-button class="save-btn" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Guardar cambios
          }
        </button>
      </div>
    }
  `,
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);

  loading = signal(true);
  saving = signal(false);

  form: SettingsForm = {
    maxFailedAttempts: 5,
    accessTokenTtl: 900,
    refreshTokenTtl: 604800,
    discoveryTtl: 300,
    searchTtl: 120,
    defaultLimit: 20,
    maxLimit: 100,
    maintenanceMode: false,
    registrationEnabled: true,
    registrationCopyEnabled: false,
    bannerEnabled: false,
    bannerHtml: '',
  };

  private originalSettings: Record<string, string> = {};

  sanitizedBanner(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.form.bannerHtml);
  }

  ngOnInit() {
    this.loadTfaStatus();
    this.loadPhone();
    this.api.get<Record<string, string>>('/admin/settings').subscribe((settings) => {
      const map: Record<string, string> = settings ?? {};
      this.originalSettings = { ...map };

      this.form.maxFailedAttempts = this.num(map, 'maxFailedAttempts', 5);
      this.form.accessTokenTtl = this.num(map, 'accessTokenTtl', 900);
      this.form.refreshTokenTtl = this.num(map, 'refreshTokenTtl', 604800);
      this.form.discoveryTtl = this.num(map, 'discoveryTtl', 300);
      this.form.searchTtl = this.num(map, 'searchTtl', 120);
      this.form.defaultLimit = this.num(map, 'defaultLimit', 20);
      this.form.maxLimit = this.num(map, 'maxLimit', 100);
      this.form.maintenanceMode = this.bool(map, 'maintenanceMode', false);
      this.form.bannerEnabled = this.bool(map, 'banner.enabled', false);
      this.form.bannerHtml = map['banner.html'] ?? '';
      this.form.registrationCopyEnabled = this.bool(map, 'email.registration.copyEnabled', false);

      // Read registration state from the feature flag (source of truth)
      this.api.get<{ groups: Record<string, { key: string; enabled: boolean }[]> }>('/admin/features').subscribe((flags) => {
        const all = Object.values(flags.groups).flat();
        const reg = all.find(f => f.key === 'platform.registration');
        this.form.registrationEnabled = reg?.enabled ?? true;
        this.originalSettings['registrationEnabled'] = String(this.form.registrationEnabled);
        this.loading.set(false);
      });
    });
  }

  save() {
    this.saving.set(true);

    const settingsPayload: Record<string, string> = {
      maxFailedAttempts: String(this.form.maxFailedAttempts),
      accessTokenTtl: String(this.form.accessTokenTtl),
      refreshTokenTtl: String(this.form.refreshTokenTtl),
      discoveryTtl: String(this.form.discoveryTtl),
      searchTtl: String(this.form.searchTtl),
      defaultLimit: String(this.form.defaultLimit),
      maxLimit: String(this.form.maxLimit),
      maintenanceMode: String(this.form.maintenanceMode),
      registrationEnabled: String(this.form.registrationEnabled),
      'banner.enabled': String(this.form.bannerEnabled),
      'banner.html': this.form.bannerHtml,
      'email.registration.copyEnabled': String(this.form.registrationCopyEnabled),
    };

    forkJoin([
      this.api.patch<void>('/admin/settings', settingsPayload),
      this.api.patch<void>('/admin/features/platform.registration', { enabled: this.form.registrationEnabled }),
    ]).subscribe({
      next: () => {
        this.snackBar.open('Configuracion guardada', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  private num(map: Record<string, string>, key: string, fallback: number): number {
    return map[key] != null ? Number(map[key]) : fallback;
  }

  private bool(map: Record<string, string>, key: string, fallback: boolean): boolean {
    return map[key] != null ? map[key] === 'true' : fallback;
  }

  // Change password
  changeForm = { currentPassword: '', newPassword: '', code: '', channel: '' };
  changeSaving = signal(false);
  changeCodeSent = signal(false);

  sendChangeCode(channel: string) {
    this.changeSaving.set(true);
    this.api.post<{ sent: boolean }>('/admin/auth/change-password/send-code', { channel }).subscribe({
      next: () => {
        this.changeSaving.set(false);
        this.changeForm.channel = channel;
        this.changeCodeSent.set(true);
        if (channel !== 'totp') {
          this.snackBar.open('Codigo enviado', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.changeSaving.set(false);
        this.snackBar.open(err?.error?.error?.message || 'Error al enviar codigo', 'OK', { duration: 3000 });
      },
    });
  }

  changePassword() {
    this.changeSaving.set(true);
    this.api.post<{ message: string }>('/admin/auth/change-password', this.changeForm).subscribe({
      next: () => {
        this.changeSaving.set(false);
        this.changeForm = { currentPassword: '', newPassword: '', code: '', channel: '' };
        this.changeCodeSent.set(false);
        this.snackBar.open('Contrasena actualizada', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.changeSaving.set(false);
        this.snackBar.open(err?.error?.error?.message || 'Error al cambiar contrasena', 'OK', { duration: 3000 });
      },
    });
  }

  // Phone
  readonly countryCodes = COUNTRY_CODES;
  phoneCountryCode = '+52';
  phoneLocal = '';
  phoneTfaCode = '';
  phoneSaving = signal(false);

  private loadPhone() {
    this.api.get<{ phone?: string | null }>('/admin/auth/me').subscribe({
      next: (user) => {
        const phone = (user as any).phone ?? '';
        if (phone) {
          const match = COUNTRY_CODES.find(c => phone.startsWith(c.code));
          if (match) {
            this.phoneCountryCode = match.code;
            this.phoneLocal = phone.slice(match.code.length);
          } else {
            this.phoneLocal = phone;
          }
        }
      },
    });
  }

  updatePhone() {
    this.phoneSaving.set(true);
    const phone = this.phoneCountryCode + this.phoneLocal.replace(/\D/g, '');
    this.api.post<{ message: string }>('/admin/auth/update-phone', {
      phone,
      tfaCode: this.phoneTfaCode,
    }).subscribe({
      next: () => {
        this.phoneSaving.set(false);
        this.phoneTfaCode = '';
        this.snackBar.open('Telefono actualizado', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.phoneSaving.set(false);
        this.snackBar.open(err?.error?.error?.message || 'Error', 'OK', { duration: 3000 });
      },
    });
  }

  // 2FA
  tfaEnabled = signal(false);
  tfaSetupData = signal<{ qrDataUrl: string } | null>(null);
  tfaSaving = signal(false);
  tfaVerifyCode = '';
  tfaDisableCode = '';

  private loadTfaStatus() {
    this.api.get<{ tfaEnabled?: boolean }>('/admin/auth/me').subscribe({
      next: (user) => this.tfaEnabled.set(user.tfaEnabled ?? false),
    });
  }

  startTfaSetup() {
    this.api.post<{ qrDataUrl: string }>('/admin/auth/tfa/setup').subscribe({
      next: (data) => this.tfaSetupData.set(data),
      error: () => this.snackBar.open('Error al generar QR', 'OK', { duration: 3000 }),
    });
  }

  enableTfa() {
    this.tfaSaving.set(true);
    this.api.post<{ enabled: boolean }>('/admin/auth/tfa/enable', { code: this.tfaVerifyCode }).subscribe({
      next: () => {
        this.tfaEnabled.set(true);
        this.tfaSetupData.set(null);
        this.tfaVerifyCode = '';
        this.tfaSaving.set(false);
        this.snackBar.open('2FA activado correctamente', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.tfaSaving.set(false);
        this.snackBar.open(err?.error?.error?.message || 'Codigo invalido', 'OK', { duration: 3000 });
      },
    });
  }

  disableTfa() {
    this.tfaSaving.set(true);
    this.api.post<{ enabled: boolean }>('/admin/auth/tfa/disable', { code: this.tfaDisableCode }).subscribe({
      next: () => {
        this.tfaEnabled.set(false);
        this.tfaDisableCode = '';
        this.tfaSaving.set(false);
        this.snackBar.open('2FA desactivado', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.tfaSaving.set(false);
        this.snackBar.open(err?.error?.error?.message || 'Codigo invalido', 'OK', { duration: 3000 });
      },
    });
  }
}
