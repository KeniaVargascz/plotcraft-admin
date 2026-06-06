import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpApiService } from '../../core/services/http-api.service';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult } from '../../shared/confirm-dialog.component';

interface Community {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  owner: {
    id: string;
    username: string;
  };
  membersCount: number;
  createdAt: string;
}

interface CommunitiesResponse {
  data: Community[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

@Component({
  selector: 'app-communities',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatSortModule,
    MatChipsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatMenuModule,
    MatTabsModule, MatCardModule, MatBadgeModule,
    MatSnackBarModule, MatDialogModule,
  ],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 220px; }
    .status-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .status-chip {
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .status-chip.selected {
      background: #c9a84c !important;
      color: #fff !important;
    }
    .table-container {
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e8e8ec;
      overflow: hidden;
    }
    table { width: 100%; }
    .chip-status { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .loading { display: grid; place-items: center; padding: 4rem; }
    .pending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .pending-card {
      padding: 1.25rem;
      background: #fff;
      border: 1px solid #e8e8ec;
      border-radius: 1rem;
    }
    .pending-card h3 { margin: 0 0 0.25rem; font-size: 1rem; color: #1a1a2e; }
    .pending-card .desc { font-size: 0.82rem; color: #666; margin-bottom: 0.5rem; }
    .pending-card .meta { font-size: 0.78rem; color: #888; margin-bottom: 0.75rem; }
    .pending-card .card-actions { display: flex; gap: 0.5rem; }
    .reject-input {
      width: 100%;
      margin-top: 0.5rem;
    }
    .empty { text-align: center; padding: 3rem; color: #888; font-size: 0.9rem; }
    .tab-badge { margin-left: 0.5rem; }
  `],
  template: `
    <h1>Comunidades</h1>
    <mat-tab-group (selectedIndexChange)="onTabChange($event)">
      <mat-tab>
        <ng-template mat-tab-label>
          Pendientes
          @if (pendingCount() > 0) {
            <span class="tab-badge" matBadge="{{ pendingCount() }}" matBadgeOverlap="false" matBadgeSize="small"></span>
          }
        </ng-template>
        @if (loadingPending()) {
          <div class="loading"><mat-spinner /></div>
        } @else if (pendingCommunities().length === 0) {
          <div class="empty">No hay comunidades pendientes de revision</div>
        } @else {
          <div class="pending-grid">
            @for (c of pendingCommunities(); track c.id) {
              <div class="pending-card">
                <h3>{{ c.name }}</h3>
                <div class="desc">{{ c.description || 'Sin descripcion' }}</div>
                <div class="meta">
                  <span>Tipo: {{ c.type }}</span> &middot;
                  <span>Creador: {{ c.owner.username }}</span> &middot;
                  <span>{{ c.createdAt | date:'shortDate' }}</span>
                </div>
                @if (rejectingId() === c.id) {
                  <mat-form-field class="reject-input" appearance="outline">
                    <mat-label>Razon del rechazo</mat-label>
                    <input matInput [ngModel]="rejectReason()" (ngModelChange)="rejectReason.set($event)" />
                  </mat-form-field>
                  <div class="card-actions">
                    <button mat-stroked-button color="warn" (click)="confirmReject(c)">Confirmar rechazo</button>
                    <button mat-stroked-button (click)="rejectingId.set(null)">Cancelar</button>
                  </div>
                } @else {
                  <div class="card-actions">
                    <button mat-flat-button color="primary" (click)="approve(c)">
                      <mat-icon>check</mat-icon> Aprobar
                    </button>
                    <button mat-stroked-button color="warn" (click)="startReject(c)">
                      <mat-icon>close</mat-icon> Rechazar
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </mat-tab>
      <mat-tab label="Todas">
        <div class="toolbar" style="margin-top: 1rem;">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Buscar comunidad</mat-label>
            <input matInput [ngModel]="search()" (ngModelChange)="onSearch($event)" placeholder="Nombre..." />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <div class="status-filters">
            @for (s of statusOptions; track s) {
              <mat-chip
                class="status-chip"
                [class.selected]="statusFilter() === s"
                (click)="onStatusFilter(s)"
              >{{ s }}</mat-chip>
            }
          </div>
        </div>
        @if (loadingAll()) {
          <div class="loading"><mat-spinner /></div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="communities()" matSort (matSortChange)="onSort($event)">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
                <td mat-cell *matCellDef="let c">{{ c.name }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
                <td mat-cell *matCellDef="let c">{{ c.type }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                <td mat-cell *matCellDef="let c">
                  <mat-chip class="chip-status">{{ c.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="owner">
                <th mat-header-cell *matHeaderCellDef>Creador</th>
                <td mat-cell *matCellDef="let c">{{ c.owner.username }}</td>
              </ng-container>
              <ng-container matColumnDef="membersCount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Miembros</th>
                <td mat-cell *matCellDef="let c">{{ c.membersCount }}</td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Creada</th>
                <td mat-cell *matCellDef="let c">{{ c.createdAt | date:'shortDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    @if (c.status === 'PENDING') {
                      <button mat-menu-item (click)="approve(c)">
                        <mat-icon>check_circle</mat-icon> Aprobar
                      </button>
                      <button mat-menu-item (click)="rejectFromTable(c)">
                        <mat-icon>cancel</mat-icon> Rechazar
                      </button>
                    }
                    @if (c.status !== 'SUSPENDED' && c.status !== 'PENDING' && c.status !== 'REJECTED') {
                      <button mat-menu-item (click)="suspend(c)">
                        <mat-icon>pause_circle</mat-icon> Suspender
                      </button>
                    }
                    @if (c.status === 'SUSPENDED') {
                      <button mat-menu-item (click)="activate(c)">
                        <mat-icon>play_circle</mat-icon> Activar
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
            <mat-paginator
              [length]="pagination().total"
              [pageSize]="pagination().limit"
              [pageIndex]="pagination().page - 1"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPage($event)"
            />
          </div>
        }
      </mat-tab>
    </mat-tab-group>
  `,
})
export class CommunitiesComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Pending tab
  loadingPending = signal(true);
  pendingCommunities = signal<Community[]>([]);
  pendingCount = signal(0);
  rejectingId = signal<string | null>(null);
  rejectReason = signal('');

  // All tab
  loadingAll = signal(true);
  communities = signal<Community[]>([]);
  pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  search = signal('');
  statusFilter = signal('ALL');
  sortField = signal('');
  sortDirection = signal<'asc' | 'desc' | ''>('');
  statusOptions = ['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'];
  columns = ['name', 'type', 'status', 'owner', 'membersCount', 'createdAt', 'actions'];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadPending();
    this.loadPendingCount();
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.loadPending();
      this.loadPendingCount();
    } else {
      this.loadAll(1, 20);
    }
  }

  loadPendingCount() {
    this.api.get<{ count: number }>('/admin/communities/pending/count').subscribe({
      next: (res) => this.pendingCount.set(res.count),
    });
  }

  loadPending() {
    this.loadingPending.set(true);
    this.api.get<CommunitiesResponse>('/admin/communities', { status: 'PENDING' }).subscribe((res) => {
      this.pendingCommunities.set(res.data);
      this.loadingPending.set(false);
    });
  }

  loadAll(page: number, limit: number) {
    this.loadingAll.set(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (this.search()) params['search'] = this.search();
    if (this.statusFilter() !== 'ALL') params['status'] = this.statusFilter();
    if (this.sortField() && this.sortDirection()) {
      params['sort'] = this.sortField();
      params['order'] = this.sortDirection();
    }

    this.api.get<CommunitiesResponse>('/admin/communities', params).subscribe((res) => {
      this.communities.set(res.data);
      this.pagination.set(res.pagination);
      this.loadingAll.set(false);
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadAll(1, this.pagination().limit), 400);
  }

  onStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.loadAll(1, this.pagination().limit);
  }

  onPage(event: PageEvent) {
    this.loadAll(event.pageIndex + 1, event.pageSize);
  }

  onSort(sort: Sort) {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction);
    this.loadAll(1, this.pagination().limit);
  }

  approve(c: Community) {
    this.api.post(`/admin/communities/${c.id}/approve`).subscribe({
      next: () => {
        this.snackBar.open(`"${c.name}" aprobada`, 'OK', { duration: 2000 });
        this.loadPending();
        this.loadPendingCount();
      },
      error: () => this.snackBar.open('Error al aprobar', 'OK', { duration: 3000 }),
    });
  }

  startReject(c: Community) {
    this.rejectingId.set(c.id);
    this.rejectReason.set('');
  }

  confirmReject(c: Community) {
    const reason = this.rejectReason();
    if (!reason.trim()) {
      this.snackBar.open('Ingresa una razon para el rechazo', 'OK', { duration: 2000 });
      return;
    }
    this.api.post(`/admin/communities/${c.id}/reject`, { reason }).subscribe({
      next: () => {
        this.snackBar.open(`"${c.name}" rechazada`, 'OK', { duration: 2000 });
        this.rejectingId.set(null);
        this.loadPending();
        this.loadPendingCount();
      },
      error: () => this.snackBar.open('Error al rechazar', 'OK', { duration: 3000 }),
    });
  }

  rejectFromTable(c: Community) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Rechazar comunidad',
        message: `Seguro que quieres rechazar "${c.name}"?`,
        confirmLabel: 'Rechazar',
        color: 'warn',
        promptLabel: 'Razon del rechazo',
        promptRequired: true,
      } as ConfirmDialogData,
    });
    ref.afterClosed().subscribe((result?: ConfirmDialogResult) => {
      if (!result?.confirmed || !result.reason?.trim()) return;
      this.api.post(`/admin/communities/${c.id}/reject`, { reason: result.reason }).subscribe({
        next: () => {
          this.snackBar.open(`"${c.name}" rechazada`, 'OK', { duration: 2000 });
          this.loadAll(this.pagination().page, this.pagination().limit);
          this.loadPendingCount();
        },
        error: () => this.snackBar.open('Error al rechazar', 'OK', { duration: 3000 }),
      });
    });
  }

  suspend(c: Community) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Suspender comunidad',
        message: `Seguro que quieres suspender "${c.name}"?`,
        confirmLabel: 'Suspender',
        color: 'warn',
      } as ConfirmDialogData,
    });
    ref.afterClosed().subscribe((result?: ConfirmDialogResult) => {
      if (!result?.confirmed) return;
      this.api.patch(`/admin/communities/${c.id}/suspend`).subscribe({
        next: () => {
          this.snackBar.open(`"${c.name}" suspendida`, 'OK', { duration: 2000 });
          this.loadAll(this.pagination().page, this.pagination().limit);
        },
        error: () => this.snackBar.open('Error al suspender', 'OK', { duration: 3000 }),
      });
    });
  }

  activate(c: Community) {
    this.api.patch(`/admin/communities/${c.id}/activate`).subscribe({
      next: () => {
        this.snackBar.open(`"${c.name}" activada`, 'OK', { duration: 2000 });
        this.loadAll(this.pagination().page, this.pagination().limit);
      },
      error: () => this.snackBar.open('Error al activar', 'OK', { duration: 3000 }),
    });
  }
}
