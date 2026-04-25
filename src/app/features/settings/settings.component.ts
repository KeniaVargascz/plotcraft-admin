import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { HttpApiService } from '../../core/services/http-api.service';

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
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatIconModule,
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
            </div>
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
  };

  private originalSettings: Record<string, string> = {};

  ngOnInit() {
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
    const changes: Record<string, string> = {};
    const current: Record<string, string> = {
      maxFailedAttempts: String(this.form.maxFailedAttempts),
      accessTokenTtl: String(this.form.accessTokenTtl),
      refreshTokenTtl: String(this.form.refreshTokenTtl),
      discoveryTtl: String(this.form.discoveryTtl),
      searchTtl: String(this.form.searchTtl),
      defaultLimit: String(this.form.defaultLimit),
      maxLimit: String(this.form.maxLimit),
      maintenanceMode: String(this.form.maintenanceMode),
      registrationEnabled: String(this.form.registrationEnabled),
    };

    for (const [key, value] of Object.entries(current)) {
      if (this.originalSettings[key] !== value) {
        changes[key] = value;
      }
    }

    if (Object.keys(changes).length === 0) {
      this.snackBar.open('No hay cambios para guardar', 'OK', { duration: 3000 });
      this.saving.set(false);
      return;
    }

    // Sync registrationEnabled with the platform.registration feature flag
    const flagSync$ = changes['registrationEnabled'] != null
      ? this.api.patch('/admin/features/platform.registration', { enabled: changes['registrationEnabled'] === 'true' })
      : null;

    this.api.patch<void>('/admin/settings', changes).subscribe({
      next: () => {
        Object.assign(this.originalSettings, changes);
        if (flagSync$) {
          flagSync$.subscribe();
        }
        this.snackBar.open('Configuracion guardada exitosamente', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Error al guardar la configuracion', 'OK', { duration: 3000 });
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
}
