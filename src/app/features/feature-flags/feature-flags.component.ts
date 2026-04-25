import { Component, OnInit, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpApiService } from '../../core/services/http-api.service';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  label: string;
  group: string;
  description: string | null;
  updatedAt: string;
}

interface GroupedResponse {
  groups: Record<string, FeatureFlag[]>;
  total: number;
}

@Component({
  selector: 'app-feature-flags',
  standalone: true,
  imports: [MatSlideToggleModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    .group { margin-bottom: 2rem; }
    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .group-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a2e;
      text-transform: capitalize;
    }
    .flag-list { display: grid; gap: 0.5rem; }
    .flag-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      background: #fff;
      border: 1px solid #e8e8ec;
      border-radius: 0.75rem;
    }
    .flag-info { flex: 1; }
    .flag-label { font-weight: 500; font-size: 0.9rem; color: #1a1a2e; }
    .flag-desc { font-size: 0.78rem; color: #888; margin-top: 0.15rem; }
    .flag-key { font-size: 0.7rem; color: #bbb; font-family: monospace; }
    .loading { display: grid; place-items: center; padding: 4rem; }
    .total { font-size: 0.85rem; color: #888; margin-bottom: 1rem; }
  `],
  template: `
    <h1>Feature Flags</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <p class="total">{{ total() }} flags configurados</p>
      @for (group of groupNames(); track group) {
        <div class="group">
          <div class="group-header">
            <span class="group-name">{{ group }}</span>
            <button mat-stroked-button (click)="toggleGroup(group, !isGroupEnabled(group))">
              {{ isGroupEnabled(group) ? 'Deshabilitar grupo' : 'Habilitar grupo' }}
            </button>
          </div>
          <div class="flag-list">
            @for (flag of groups()[group]; track flag.key) {
              <div class="flag-card">
                <div class="flag-info">
                  <div class="flag-label">{{ flag.label }}</div>
                  @if (flag.description) {
                    <div class="flag-desc">{{ flag.description }}</div>
                  }
                  <div class="flag-key">{{ flag.key }}</div>
                </div>
                <mat-slide-toggle
                  [checked]="flag.enabled"
                  (change)="toggleFlag(flag, $event.checked)"
                />
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class FeatureFlagsComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  groups = signal<Record<string, FeatureFlag[]>>({});
  total = signal(0);
  groupNames = signal<string[]>([]);

  ngOnInit() {
    this.loadFlags();
  }

  loadFlags() {
    this.api.get<GroupedResponse>('/admin/features').subscribe((res) => {
      this.groups.set(res.groups);
      this.total.set(res.total);
      this.groupNames.set(Object.keys(res.groups));
      this.loading.set(false);
    });
  }

  isGroupEnabled(group: string): boolean {
    return this.groups()[group]?.every((f) => f.enabled) ?? false;
  }

  toggleFlag(flag: FeatureFlag, enabled: boolean) {
    this.api.patch(`/admin/features/${flag.key}`, { enabled }).subscribe({
      next: () => {
        this.loadFlags();
        this.snackBar.open(`${flag.label}: ${enabled ? 'habilitado' : 'deshabilitado'}`, 'OK', { duration: 2000 });
      },
      error: () => {
        this.loadFlags();
        this.snackBar.open('Error al actualizar — reintenta', 'OK', { duration: 3000 });
      },
    });
  }

  toggleGroup(group: string, enabled: boolean) {
    this.api.patch(`/admin/features/group/${group}/toggle`, { enabled }).subscribe({
      next: () => {
        this.loadFlags();
        this.snackBar.open(`Grupo "${group}": ${enabled ? 'habilitado' : 'deshabilitado'}`, 'OK', { duration: 2000 });
      },
    });
  }
}
