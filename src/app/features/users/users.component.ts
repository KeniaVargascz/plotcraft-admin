import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpApiService } from '../../core/services/http-api.service';
import { UserDetailDialogComponent } from './user-detail-dialog.component';

interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  role: string;
  novelsCount: number;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface UsersResponse {
  data: User[];
  pagination: Pagination;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatChipsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatMenuModule,
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
    .avatar-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      background: #e8e8ec;
    }
    .avatar-placeholder {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #c9a84c;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .chip-status { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .loading { display: grid; place-items: center; padding: 4rem; }
  `],
  template: `
    <h1>Usuarios</h1>
    <div class="toolbar">
      <mat-form-field class="search-field" appearance="outline">
        <mat-label>Buscar usuario</mat-label>
        <input matInput [ngModel]="search()" (ngModelChange)="onSearch($event)" placeholder="Nombre, email..." />
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
    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="table-container">
        <table mat-table [dataSource]="users()">
          <ng-container matColumnDef="avatar">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let user">
              @if (user.profile?.avatarUrl) {
                <img class="avatar" [src]="user.profile.avatarUrl" [alt]="user.username" />
              } @else {
                <div class="avatar-placeholder">{{ user.username.charAt(0).toUpperCase() }}</div>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let user">{{ user.username }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip class="chip-status">{{ user.status }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let user">{{ user.role }}</td>
          </ng-container>
          <ng-container matColumnDef="novelsCount">
            <th mat-header-cell *matHeaderCellDef>Novelas</th>
            <td mat-cell *matCellDef="let user">{{ user.novelsCount }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Registro</th>
            <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'shortDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="viewDetail(user)">
                  <mat-icon>visibility</mat-icon> Ver detalle
                </button>
                @if (user.status !== 'ACTIVE') {
                  <button mat-menu-item (click)="changeStatus(user, 'ACTIVE')">
                    <mat-icon>check_circle</mat-icon> Activar
                  </button>
                }
                @if (user.status !== 'SUSPENDED') {
                  <button mat-menu-item (click)="changeStatus(user, 'SUSPENDED')">
                    <mat-icon>pause_circle</mat-icon> Suspender
                  </button>
                }
                @if (user.status !== 'BANNED') {
                  <button mat-menu-item (click)="changeStatus(user, 'BANNED')">
                    <mat-icon>block</mat-icon> Banear
                  </button>
                }
                <button mat-menu-item (click)="toggleAdmin(user)">
                  <mat-icon>admin_panel_settings</mat-icon>
                  {{ user.role === 'ADMIN' ? 'Quitar Admin' : 'Hacer Admin' }}
                </button>
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
  `,
})
export class UsersComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  users = signal<User[]>([]);
  pagination = signal<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  search = signal('');
  statusFilter = signal('ALL');
  statusOptions = ['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'];
  columns = ['avatar', 'username', 'email', 'status', 'role', 'novelsCount', 'createdAt', 'actions'];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.load(1, 20);
  }

  load(page: number, limit: number) {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (this.search()) params['search'] = this.search();
    if (this.statusFilter() !== 'ALL') params['status'] = this.statusFilter();

    this.api.get<UsersResponse>('/admin/users', params).subscribe((res) => {
      this.users.set(res.data);
      this.pagination.set(res.pagination);
      this.loading.set(false);
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(1, this.pagination().limit), 400);
  }

  onStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.load(1, this.pagination().limit);
  }

  onPage(event: PageEvent) {
    this.load(event.pageIndex + 1, event.pageSize);
  }

  viewDetail(user: User) {
    const ref = this.dialog.open(UserDetailDialogComponent, {
      width: '560px',
      data: { userId: user.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.changed) this.load(this.pagination().page, this.pagination().limit);
    });
  }

  changeStatus(user: User, status: string) {
    if (status === 'BANNED' || status === 'SUSPENDED') {
      if (!confirm(`Seguro que quieres cambiar el estado de ${user.username} a ${status}?`)) return;
    }
    const reason = (status === 'BANNED' || status === 'SUSPENDED')
      ? prompt('Razon (opcional):') ?? ''
      : '';
    this.api.patch(`/admin/users/${user.id}/status`, { status, reason }).subscribe({
      next: () => {
        this.snackBar.open(`${user.username}: estado cambiado a ${status}`, 'OK', { duration: 2000 });
        this.load(this.pagination().page, this.pagination().limit);
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'OK', { duration: 3000 }),
    });
  }

  toggleAdmin(user: User) {
    const action = user.role === 'ADMIN' ? 'quitar permisos de admin a' : 'dar permisos de admin a';
    if (!confirm(`Seguro que quieres ${action} ${user.username}?`)) return;
    this.api.patch(`/admin/users/${user.id}/admin`, {}).subscribe({
      next: () => {
        this.snackBar.open(`${user.username}: rol actualizado`, 'OK', { duration: 2000 });
        this.load(this.pagination().page, this.pagination().limit);
      },
      error: () => this.snackBar.open('Error al cambiar rol', 'OK', { duration: 3000 }),
    });
  }
}
