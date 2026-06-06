import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpApiService } from '../../core/services/http-api.service';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult } from '../../shared/confirm-dialog.component';
import { signal } from '@angular/core';

interface UserDetail {
  id: string;
  username: string;
  email: string;
  status: string;
  role: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  };
  stats: {
    novels: number;
    chapters: number;
    posts: number;
    comments: number;
    followers: number;
    following: number;
    worlds: number;
    characters: number;
  };
  createdAt: string;
}

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe,
    MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      background: #e8e8ec;
    }
    .avatar-placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #c9a84c;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .user-meta h2 { margin: 0; font-size: 1.15rem; color: #1a1a2e; }
    .user-meta .username { font-size: 0.85rem; color: #888; }
    .user-meta .email { font-size: 0.8rem; color: #666; }
    .status-chip { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin: 1.25rem 0;
    }
    .stat-item {
      text-align: center;
      padding: 0.75rem;
      background: #f5f5f7;
      border-radius: 0.5rem;
    }
    .stat-value { font-size: 1.25rem; font-weight: 700; color: #1a1a2e; }
    .stat-label { font-size: 0.7rem; color: #888; text-transform: uppercase; margin-top: 0.15rem; }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.85rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-label { color: #888; }
    .info-value { color: #1a1a2e; font-weight: 500; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
    .loading { display: grid; place-items: center; padding: 3rem; }
  `],
  template: `
    <h1 mat-dialog-title>Detalle de usuario</h1>
    <div mat-dialog-content>
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40" /></div>
      } @else if (user()) {
        <div class="dialog-header">
          @if (user()!.profile.avatarUrl) {
            <img class="avatar" [src]="user()!.profile.avatarUrl" [alt]="user()!.username" />
          } @else {
            <div class="avatar-placeholder">{{ user()!.username.charAt(0).toUpperCase() }}</div>
          }
          <div class="user-meta">
            <h2>{{ user()!.profile.displayName || user()!.username }}</h2>
            <div class="username">@{{ user()!.username }}</div>
            <div class="email">{{ user()!.email }}</div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">Estado</span>
          <span class="info-value">
            <mat-chip class="status-chip">{{ user()!.status }}</mat-chip>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Rol</span>
          <span class="info-value">{{ user()!.role }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Registrado</span>
          <span class="info-value">{{ user()!.createdAt | date:'mediumDate' }}</span>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.novels | number }}</div>
            <div class="stat-label">Novelas</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.chapters | number }}</div>
            <div class="stat-label">Capitulos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.posts | number }}</div>
            <div class="stat-label">Posts</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.comments | number }}</div>
            <div class="stat-label">Comentarios</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.followers | number }}</div>
            <div class="stat-label">Seguidores</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.following | number }}</div>
            <div class="stat-label">Siguiendo</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.worlds | number }}</div>
            <div class="stat-label">Mundos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user()!.stats.characters | number }}</div>
            <div class="stat-label">Personajes</div>
          </div>
        </div>
        <div class="actions">
          @if (user()!.status !== 'ACTIVE') {
            <button mat-stroked-button color="primary" (click)="changeStatus('ACTIVE')" [disabled]="actionLoading()">
              @if (actionLoading() === 'ACTIVE') { <mat-spinner diameter="18" /> } @else { <mat-icon>check_circle</mat-icon> } Activar
            </button>
          }
          @if (user()!.status !== 'SUSPENDED') {
            <button mat-stroked-button color="warn" (click)="changeStatus('SUSPENDED')" [disabled]="actionLoading()">
              @if (actionLoading() === 'SUSPENDED') { <mat-spinner diameter="18" /> } @else { <mat-icon>pause_circle</mat-icon> } Suspender
            </button>
          }
          @if (user()!.status !== 'BANNED') {
            <button mat-stroked-button color="warn" (click)="changeStatus('BANNED')" [disabled]="actionLoading()">
              @if (actionLoading() === 'BANNED') { <mat-spinner diameter="18" /> } @else { <mat-icon>block</mat-icon> } Banear
            </button>
          }
          <button mat-stroked-button (click)="toggleAdmin()" [disabled]="actionLoading()">
            @if (actionLoading() === 'ADMIN') { <mat-spinner diameter="18" /> } @else { <mat-icon>admin_panel_settings</mat-icon> }
            {{ user()!.role === 'ADMIN' ? 'Quitar Admin' : 'Hacer Admin' }}
          </button>
        </div>
      }
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </div>
  `,
})
export class UserDetailDialogComponent {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<UserDetailDialogComponent>);
  private readonly data: { userId: string } = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  actionLoading = signal<string | null>(null);
  user = signal<UserDetail | null>(null);

  ngOnInit() {
    this.api.get<UserDetail>(`/admin/users/${this.data.userId}`).subscribe({
      next: (u) => {
        this.user.set(u);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar usuario', 'OK', { duration: 3000 });
        this.dialogRef.close();
      },
    });
  }

  changeStatus(status: string) {
    const needsReason = status === 'BANNED' || status === 'SUSPENDED';
    if (needsReason) {
      const statusLabel = status === 'BANNED' ? 'Banear' : 'Suspender';
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: `${statusLabel} usuario`,
          message: `Seguro que quieres ${statusLabel.toLowerCase()} a "${this.user()?.username}"?`,
          confirmLabel: statusLabel,
          color: 'warn',
          promptLabel: 'Razon (opcional)',
        } as ConfirmDialogData,
      });
      ref.afterClosed().subscribe((result?: ConfirmDialogResult) => {
        if (!result?.confirmed) return;
        this.applyStatusChange(status, result.reason ?? '');
      });
    } else {
      this.applyStatusChange(status, '');
    }
  }

  private applyStatusChange(status: string, reason: string) {
    this.actionLoading.set(status);
    this.api.patch(`/admin/users/${this.data.userId}/status`, { status, reason }).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.user.update((u) => u ? { ...u, status } : u);
        this.snackBar.open(`Estado cambiado a ${status}`, 'OK', { duration: 2000 });
        this.dialogRef.close({ changed: true });
      },
      error: () => {
        this.actionLoading.set(null);
        this.snackBar.open('Error al cambiar estado', 'OK', { duration: 3000 });
      },
    });
  }

  toggleAdmin() {
    this.actionLoading.set('ADMIN');
    this.api.patch(`/admin/users/${this.data.userId}/admin`, {}).subscribe({
      next: () => {
        this.actionLoading.set(null);
        const newRole = this.user()!.role === 'ADMIN' ? 'USER' : 'ADMIN';
        this.user.update((u) => u ? { ...u, role: newRole } : u);
        this.snackBar.open(`Rol cambiado a ${newRole}`, 'OK', { duration: 2000 });
        this.dialogRef.close({ changed: true });
      },
      error: () => {
        this.actionLoading.set(null);
        this.snackBar.open('Error al cambiar rol', 'OK', { duration: 3000 });
      },
    });
  }
}
