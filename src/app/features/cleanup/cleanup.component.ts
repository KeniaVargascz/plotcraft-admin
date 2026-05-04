import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpApiService } from '../../core/services/http-api.service';

interface TokenPreview {
  expiredCount: number;
  revokedOldCount: number;
  totalCleanable: number;
}

interface CleanupResult {
  task: string;
  deletedCount: number;
  details?: Record<string, unknown>;
}

interface InactiveUser {
  id: string;
  email: string;
  username: string;
  lastLoginAt: string | null;
  daysSinceLogin: number;
}

interface CleanupTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  previewPath: string;
  executePath: string;
  executeMethod: 'delete';
  preview: { total: number; breakdown: string } | null;
  loading: boolean;
  executing: boolean;
  lastResult: CleanupResult | null;
}

@Component({
  selector: 'app-cleanup',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #1a1a2e; }
    .subtitle { color: #888; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }
    .task-card {
      padding: 1.5rem;
      border-radius: 1rem;
      background: #fff;
      border: 1px solid #e8e8ec;
    }
    .task-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .task-header mat-icon { color: #c9a84c; font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
    .task-title { font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .task-desc { font-size: 0.85rem; color: #888; margin-bottom: 1rem; }
    .task-preview {
      background: #f8f8fa;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .preview-total {
      font-size: 1.25rem;
      font-weight: 700;
      color: #c9a84c;
    }
    .preview-breakdown { color: #666; margin-top: 0.25rem; }
    .task-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .btn-preview {
      color: #1a1a2e !important;
      border-color: #e0e0e0 !important;
    }
    .btn-execute {
      background: #c9a84c !important;
      color: #1a1a2e !important;
      font-weight: 600;
    }
    .btn-execute:disabled {
      background: #e0e0e0 !important;
      color: #999 !important;
    }
    .result-banner {
      background: #e8f5e9;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #2e7d32;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .loading-inline { display: inline-flex; vertical-align: middle; }
    .task-card.wide { grid-column: 1 / -1; }
    .users-table {
      width: 100%;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }
    .users-table table { width: 100%; border-collapse: collapse; }
    .users-table th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      border-bottom: 1px solid #e8e8ec;
      background: #f8f8fa;
    }
    .users-table td { padding: 0.5rem 0.75rem; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .badge-days {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #fff3e0;
      color: #e65100;
    }
    .badge-days.critical { background: #fce4ec; color: #c62828; }
    .btn-sm { font-size: 0.8rem !important; padding: 0.25rem 0.75rem !important; }
    .empty-state { padding: 1.5rem; text-align: center; color: #888; font-size: 0.85rem; }
  `],
  template: `
    <h1>Limpieza de Base de Datos</h1>
    <p class="subtitle">Ejecuta tareas de mantenimiento para optimizar el almacenamiento</p>

    <div class="tasks-grid">
      @for (task of tasks(); track task.id) {
        <div class="task-card">
          <div class="task-header">
            <mat-icon>{{ task.icon }}</mat-icon>
            <span class="task-title">{{ task.title }}</span>
          </div>
          <p class="task-desc">{{ task.description }}</p>

          @if (task.preview) {
            <div class="task-preview">
              <div class="preview-total">{{ task.preview.total | number }} registros</div>
              <div class="preview-breakdown">{{ task.preview.breakdown }}</div>
            </div>
          }

          <div class="task-actions">
            <button mat-stroked-button class="btn-preview" (click)="loadPreview(task)" [disabled]="task.loading">
              @if (task.loading) {
                <mat-spinner diameter="18" class="loading-inline" />
              } @else {
                <mat-icon>search</mat-icon>
              }
              Vista previa
            </button>
            <button mat-flat-button class="btn-execute"
              (click)="execute(task)"
              [disabled]="task.executing || !task.preview || task.preview.total === 0">
              @if (task.executing) {
                <mat-spinner diameter="18" class="loading-inline" />
              } @else {
                <mat-icon>delete_sweep</mat-icon>
              }
              Ejecutar
            </button>
          </div>

          @if (task.lastResult) {
            <div class="result-banner">
              <mat-icon>check_circle</mat-icon>
              {{ task.lastResult.deletedCount | number }} registros eliminados
            </div>
          }
        </div>
      }

      <div class="task-card wide">
        <div class="task-header">
          <mat-icon>person_off</mat-icon>
          <span class="task-title">Usuarios inactivos</span>
        </div>
        <p class="task-desc">Usuarios sin login en mas de 180 dias, sin contenido publico. Respalda sus datos antes de eliminarlos.</p>

        @if (inactiveUsers().length > 0) {
          <div class="task-preview">
            <div class="preview-total">{{ inactiveUsers().length }} usuarios</div>
            <div class="preview-breakdown">Sin actividad por mas de 180 dias</div>
          </div>
        }

        <div class="task-actions" style="margin-bottom: 0.75rem">
          <button mat-stroked-button class="btn-preview" (click)="loadInactiveUsers()" [disabled]="usersLoading()">
            @if (usersLoading()) {
              <mat-spinner diameter="18" class="loading-inline" />
            } @else {
              <mat-icon>search</mat-icon>
            }
            Vista previa
          </button>
          <button mat-flat-button class="btn-execute"
            (click)="cleanupAllUsers()"
            [disabled]="cleaningAll() || inactiveUsers().length === 0">
            @if (cleaningAll()) {
              <mat-spinner diameter="18" class="loading-inline" />
            } @else {
              <mat-icon>delete_sweep</mat-icon>
            }
            Limpiar todos
          </button>
        </div>

        @if (inactiveUsers().length > 0) {
          <div class="users-table">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Ultimo login</th>
                  <th>Dias</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (user of inactiveUsers(); track user.id) {
                  <tr>
                    <td>{{ user.username }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yyyy') : 'Nunca' }}</td>
                    <td>
                      <span class="badge-days" [class.critical]="user.daysSinceLogin > 365">
                        {{ user.daysSinceLogin }}d
                      </span>
                    </td>
                    <td>
                      <button mat-flat-button class="btn-execute btn-sm"
                        (click)="cleanupUser(user)"
                        [disabled]="userProcessing().has(user.id)">
                        @if (userProcessing().has(user.id)) {
                          <mat-spinner diameter="14" class="loading-inline" />
                        } @else {
                          <mat-icon>delete_sweep</mat-icon>
                        }
                        Limpiar
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (usersLoaded()) {
          <div class="empty-state">No se encontraron usuarios inactivos</div>
        }
      </div>
    </div>
  `,
})
export class CleanupComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);

  tasks = signal<CleanupTask[]>([
    {
      id: 'tokens',
      title: 'Tokens expirados',
      description: 'Elimina refresh tokens expirados y tokens revocados con mas de 7 dias de antiguedad',
      icon: 'vpn_key',
      previewPath: '/admin/cleanup/tokens/preview',
      executePath: '/admin/cleanup/tokens',
      executeMethod: 'delete',
      preview: null,
      loading: false,
      executing: false,
      lastResult: null,
    },
    {
      id: 'otps',
      title: 'Codigos OTP',
      description: 'Elimina codigos OTP expirados y ya utilizados (registro, password reset)',
      icon: 'pin',
      previewPath: '/admin/cleanup/otps/preview',
      executePath: '/admin/cleanup/otps',
      executeMethod: 'delete',
      preview: null,
      loading: false,
      executing: false,
      lastResult: null,
    },
    {
      id: 'notifications',
      title: 'Notificaciones viejas',
      description: 'Elimina notificaciones leidas con mas de 30 dias y no leidas con mas de 90 dias',
      icon: 'notifications_off',
      previewPath: '/admin/cleanup/notifications/preview',
      executePath: '/admin/cleanup/notifications',
      executeMethod: 'delete',
      preview: null,
      loading: false,
      executing: false,
      lastResult: null,
    },
    {
      id: 'reading-history',
      title: 'Historial de lectura',
      description: 'Elimina registros de lectura con mas de 1 ano de antiguedad',
      icon: 'auto_stories',
      previewPath: '/admin/cleanup/reading-history/preview',
      executePath: '/admin/cleanup/reading-history',
      executeMethod: 'delete',
      preview: null,
      loading: false,
      executing: false,
      lastResult: null,
    },
  ]);

  ngOnInit() {
    for (const task of this.tasks()) {
      this.loadPreview(task);
    }
  }

  loadPreview(task: CleanupTask) {
    this.updateTask(task.id, { loading: true, lastResult: null });

    this.api.get<Record<string, number>>(task.previewPath).subscribe({
      next: (data) => {
        let breakdown = '';
        if (task.id === 'tokens') {
          breakdown = `${data['expiredCount']} expirados + ${data['revokedOldCount']} revocados (>7d)`;
        } else if (task.id === 'otps') {
          breakdown = `${data['expiredCount']} expirados + ${data['usedCount']} utilizados`;
        } else if (task.id === 'notifications') {
          breakdown = `${data['readOldCount']} leidas >30d + ${data['unreadOldCount']} no leidas >90d`;
        } else if (task.id === 'reading-history') {
          breakdown = `${data['oldCount']} registros con mas de 1 ano`;
        }
        this.updateTask(task.id, {
          loading: false,
          preview: { total: data['totalCleanable'], breakdown },
        });
      },
      error: () => {
        this.updateTask(task.id, { loading: false });
        this.snackBar.open('Error al cargar vista previa', 'OK', { duration: 3000 });
      },
    });
  }

  execute(task: CleanupTask) {
    this.updateTask(task.id, { executing: true });

    this.api.delete<CleanupResult>(task.executePath).subscribe({
      next: (result) => {
        this.updateTask(task.id, {
          executing: false,
          lastResult: result,
          preview: null,
        });
        this.snackBar.open(
          `${result.deletedCount} registros eliminados`,
          'OK',
          { duration: 4000 },
        );
        // Refresh preview after execution
        setTimeout(() => this.loadPreview(task), 500);
      },
      error: () => {
        this.updateTask(task.id, { executing: false });
        this.snackBar.open('Error al ejecutar limpieza', 'OK', { duration: 3000 });
      },
    });
  }

  private updateTask(id: string, updates: Partial<CleanupTask>) {
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }

  // Inactive users section
  inactiveUsers = signal<InactiveUser[]>([]);
  usersLoading = signal(false);
  usersLoaded = signal(false);
  userProcessing = signal<Set<string>>(new Set());
  cleaningAll = signal(false);

  loadInactiveUsers() {
    this.usersLoading.set(true);
    this.api.get<{ users: InactiveUser[]; totalCount: number }>('/admin/cleanup/inactive-users/preview', { days: '180' }).subscribe({
      next: (data) => {
        this.inactiveUsers.set(data.users);
        this.usersLoading.set(false);
        this.usersLoaded.set(true);
      },
      error: () => {
        this.usersLoading.set(false);
        this.snackBar.open('Error al buscar usuarios inactivos', 'OK', { duration: 3000 });
      },
    });
  }

  cleanupAllUsers() {
    this.cleaningAll.set(true);
    this.api.delete<{ usersProcessed: number; totalDeleted: number }>(
      '/admin/cleanup/inactive-users/all?days=180',
    ).subscribe({
      next: (result) => {
        this.cleaningAll.set(false);
        this.inactiveUsers.set([]);
        this.snackBar.open(
          `${result.usersProcessed} usuarios limpiados (${result.totalDeleted} registros eliminados)`,
          'OK',
          { duration: 5000 },
        );
      },
      error: () => {
        this.cleaningAll.set(false);
        this.snackBar.open('Error al limpiar usuarios', 'OK', { duration: 3000 });
      },
    });
  }

  cleanupUser(user: InactiveUser) {
    this.userProcessing.update((s) => new Set(s).add(user.id));

    this.api.delete<{ totalDeleted: number; backupId: string; backupSize: number }>(
      `/admin/cleanup/inactive-users/${user.id}`,
    ).subscribe({
      next: (result) => {
        this.userProcessing.update((s) => { const n = new Set(s); n.delete(user.id); return n; });
        this.inactiveUsers.update((users) => users.filter((u) => u.id !== user.id));
        this.snackBar.open(
          `${user.username}: ${result.totalDeleted} registros limpiados (backup: ${Math.round(result.backupSize / 1024)}KB)`,
          'OK',
          { duration: 5000 },
        );
      },
      error: () => {
        this.userProcessing.update((s) => { const n = new Set(s); n.delete(user.id); return n; });
        this.snackBar.open('Error al limpiar usuario', 'OK', { duration: 3000 });
      },
    });
  }
}
