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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpApiService } from '../../core/services/http-api.service';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult } from '../../shared/confirm-dialog.component';

interface Novel {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
  };
  status: string;
  rating: number;
  chaptersCount: number;
  views: number;
  kudos: number;
  isPublic: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface NovelsResponse {
  data: Novel[];
  pagination: Pagination;
}

@Component({
  selector: 'app-novels',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatSortModule,
    MatChipsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
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
  `],
  template: `
    <h1>Novelas</h1>
    <div class="toolbar">
      <mat-form-field class="search-field" appearance="outline">
        <mat-label>Buscar novela</mat-label>
        <input matInput [ngModel]="search()" (ngModelChange)="onSearch($event)" placeholder="Titulo, autor..." />
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
        <table mat-table [dataSource]="novels()" matSort (matSortChange)="onSort($event)">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Titulo</th>
            <td mat-cell *matCellDef="let n">{{ n.title }}</td>
          </ng-container>
          <ng-container matColumnDef="author">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Autor</th>
            <td mat-cell *matCellDef="let n">{{ n.author.username }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
            <td mat-cell *matCellDef="let n">
              <mat-chip class="chip-status">{{ n.status }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Rating</th>
            <td mat-cell *matCellDef="let n">{{ n.rating }}</td>
          </ng-container>
          <ng-container matColumnDef="chaptersCount">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Capitulos</th>
            <td mat-cell *matCellDef="let n">{{ n.chaptersCount }}</td>
          </ng-container>
          <ng-container matColumnDef="views">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Vistas</th>
            <td mat-cell *matCellDef="let n">{{ n.views }}</td>
          </ng-container>
          <ng-container matColumnDef="kudos">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Kudos</th>
            <td mat-cell *matCellDef="let n">{{ n.kudos }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Creada</th>
            <td mat-cell *matCellDef="let n">{{ n.createdAt | date:'shortDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let n">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="viewDetail(n)">
                  <mat-icon>visibility</mat-icon> Ver detalle
                </button>
                @for (st of novelStatuses; track st) {
                  @if (n.status !== st) {
                    <button mat-menu-item (click)="changeStatus(n, st)">
                      <mat-icon>{{ statusIcon(st) }}</mat-icon> {{ st }}
                    </button>
                  }
                }
                <button mat-menu-item (click)="toggleVisibility(n)">
                  <mat-icon>{{ n.isPublic ? 'visibility_off' : 'visibility' }}</mat-icon>
                  {{ n.isPublic ? 'Ocultar' : 'Hacer publica' }}
                </button>
                <button mat-menu-item (click)="deleteNovel(n)">
                  <mat-icon>delete</mat-icon> Eliminar
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
export class NovelsComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  novels = signal<Novel[]>([]);
  pagination = signal<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  search = signal('');
  statusFilter = signal('ALL');
  sortField = signal('');
  sortDirection = signal<'asc' | 'desc' | ''>('');
  statusOptions = ['ALL', 'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'HIATUS'];
  novelStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'HIATUS'];
  columns = ['title', 'author', 'status', 'rating', 'chaptersCount', 'views', 'kudos', 'createdAt', 'actions'];

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
    if (this.sortField() && this.sortDirection()) {
      params['sort'] = this.sortField();
      params['order'] = this.sortDirection();
    }

    this.api.get<NovelsResponse>('/admin/novels', params).subscribe((res) => {
      this.novels.set(res.data);
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

  onSort(sort: Sort) {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction);
    this.load(1, this.pagination().limit);
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = {
      DRAFT: 'edit_note',
      IN_PROGRESS: 'auto_stories',
      COMPLETED: 'check_circle',
      ARCHIVED: 'archive',
      HIATUS: 'pause_circle',
    };
    return icons[status] || 'circle';
  }

  viewDetail(novel: Novel) {
    this.snackBar.open(`Novela: ${novel.title}`, 'OK', { duration: 2000 });
  }

  changeStatus(novel: Novel, status: string) {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult>(ConfirmDialogComponent, {
        data: {
          title: 'Cambiar estado',
          message: `Cambiar estado de "${novel.title}" a ${status}?`,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result?.confirmed) return;
        this.api.patch(`/admin/novels/${novel.id}`, { status }).subscribe({
          next: () => {
            this.snackBar.open(`"${novel.title}": estado cambiado a ${status}`, 'OK', { duration: 2000 });
            this.load(this.pagination().page, this.pagination().limit);
          },
          error: () => this.snackBar.open('Error al cambiar estado', 'OK', { duration: 3000 }),
        });
      });
  }

  toggleVisibility(novel: Novel) {
    this.api.patch(`/admin/novels/${novel.id}`, { isPublic: !novel.isPublic }).subscribe({
      next: () => {
        this.snackBar.open(`"${novel.title}": ${novel.isPublic ? 'oculta' : 'publica'}`, 'OK', { duration: 2000 });
        this.load(this.pagination().page, this.pagination().limit);
      },
      error: () => this.snackBar.open('Error al cambiar visibilidad', 'OK', { duration: 3000 }),
    });
  }

  deleteNovel(novel: Novel) {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult>(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar novela',
          message: `Seguro que quieres eliminar "${novel.title}"? Esta accion no se puede deshacer.`,
          color: 'warn',
          confirmLabel: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result?.confirmed) return;
        this.api.delete(`/admin/novels/${novel.id}`).subscribe({
          next: () => {
            this.snackBar.open(`"${novel.title}" eliminada`, 'OK', { duration: 2000 });
            this.load(this.pagination().page, this.pagination().limit);
          },
          error: () => this.snackBar.open('Error al eliminar novela', 'OK', { duration: 3000 }),
        });
      });
  }
}
