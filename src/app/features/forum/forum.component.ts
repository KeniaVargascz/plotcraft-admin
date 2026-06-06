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
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult } from '../../shared/confirm-dialog.component';

interface ForumThread {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
  };
  category: string;
  status: string;
  isPinned: boolean;
  views: number;
  repliesCount: number;
  reactionsCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ThreadsResponse {
  data: ForumThread[];
  pagination: Pagination;
}

@Component({
  selector: 'app-forum',
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
    .chip-status { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .loading { display: grid; place-items: center; padding: 4rem; }
    .pinned-icon { color: #c9a84c; font-size: 18px; vertical-align: middle; }
  `],
  template: `
    <h1>Foro</h1>
    <div class="toolbar">
      <mat-form-field class="search-field" appearance="outline">
        <mat-label>Buscar hilo</mat-label>
        <input matInput [ngModel]="search()" (ngModelChange)="onSearch($event)" placeholder="Titulo, autor..." />
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      <div class="status-filters">
        @for (c of categoryOptions; track c) {
          <mat-chip
            class="status-chip"
            [class.selected]="categoryFilter() === c"
            (click)="onCategoryFilter(c)"
          >{{ c }}</mat-chip>
        }
      </div>
    </div>
    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="table-container">
        <table mat-table [dataSource]="threads()">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Titulo</th>
            <td mat-cell *matCellDef="let t">
              @if (t.isPinned) {
                <mat-icon class="pinned-icon">push_pin</mat-icon>
              }
              {{ t.title }}
            </td>
          </ng-container>
          <ng-container matColumnDef="author">
            <th mat-header-cell *matHeaderCellDef>Autor</th>
            <td mat-cell *matCellDef="let t">{{ t.author.username }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let t">
              <mat-chip class="chip-status">{{ t.category }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let t">
              <mat-chip class="chip-status">{{ t.status }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="views">
            <th mat-header-cell *matHeaderCellDef>Vistas</th>
            <td mat-cell *matCellDef="let t">{{ t.views }}</td>
          </ng-container>
          <ng-container matColumnDef="repliesCount">
            <th mat-header-cell *matHeaderCellDef>Respuestas</th>
            <td mat-cell *matCellDef="let t">{{ t.repliesCount }}</td>
          </ng-container>
          <ng-container matColumnDef="reactionsCount">
            <th mat-header-cell *matHeaderCellDef>Reacciones</th>
            <td mat-cell *matCellDef="let t">{{ t.reactionsCount }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Creado</th>
            <td mat-cell *matCellDef="let t">{{ t.createdAt | date:'shortDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="togglePin(t)">
                  <mat-icon>push_pin</mat-icon>
                  {{ t.isPinned ? 'Desfijar' : 'Fijar' }}
                </button>
                @if (t.status !== 'CLOSED') {
                  <button mat-menu-item (click)="closeThread(t)">
                    <mat-icon>lock</mat-icon> Cerrar
                  </button>
                }
                <button mat-menu-item (click)="deleteThread(t)">
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
export class ForumComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  threads = signal<ForumThread[]>([]);
  pagination = signal<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  search = signal('');
  categoryFilter = signal('ALL');
  categoryOptions = ['ALL', 'GENERAL', 'FEEDBACK', 'WRITING_TIPS', 'WORLD_BUILDING', 'CHARACTER_DEV', 'PLOT_HELP'];
  columns = ['title', 'author', 'category', 'status', 'views', 'repliesCount', 'reactionsCount', 'createdAt', 'actions'];

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
    if (this.categoryFilter() !== 'ALL') params['category'] = this.categoryFilter();

    this.api.get<ThreadsResponse>('/admin/forum/threads', params).subscribe((res) => {
      this.threads.set(res.data);
      this.pagination.set(res.pagination);
      this.loading.set(false);
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(1, this.pagination().limit), 400);
  }

  onCategoryFilter(category: string) {
    this.categoryFilter.set(category);
    this.load(1, this.pagination().limit);
  }

  onPage(event: PageEvent) {
    this.load(event.pageIndex + 1, event.pageSize);
  }

  togglePin(thread: ForumThread) {
    this.api.patch(`/admin/forum/threads/${thread.id}/pin`).subscribe({
      next: () => {
        this.snackBar.open(`"${thread.title}": ${thread.isPinned ? 'desfijado' : 'fijado'}`, 'OK', { duration: 2000 });
        this.load(this.pagination().page, this.pagination().limit);
      },
      error: () => this.snackBar.open('Error al cambiar pin', 'OK', { duration: 3000 }),
    });
  }

  closeThread(thread: ForumThread) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cerrar hilo',
        message: `Seguro que quieres cerrar "${thread.title}"?`,
        confirmLabel: 'Cerrar',
      } as ConfirmDialogData,
    });
    ref.afterClosed().subscribe((result?: ConfirmDialogResult) => {
      if (!result?.confirmed) return;
      this.api.patch(`/admin/forum/threads/${thread.id}/close`).subscribe({
        next: () => {
          this.snackBar.open(`"${thread.title}" cerrado`, 'OK', { duration: 2000 });
          this.load(this.pagination().page, this.pagination().limit);
        },
        error: () => this.snackBar.open('Error al cerrar hilo', 'OK', { duration: 3000 }),
      });
    });
  }

  deleteThread(thread: ForumThread) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar hilo',
        message: `Seguro que quieres eliminar "${thread.title}"? Esta accion no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        color: 'warn',
      } as ConfirmDialogData,
    });
    ref.afterClosed().subscribe((result?: ConfirmDialogResult) => {
      if (!result?.confirmed) return;
      this.api.delete(`/admin/forum/threads/${thread.id}`).subscribe({
        next: () => {
          this.snackBar.open(`"${thread.title}" eliminado`, 'OK', { duration: 2000 });
          this.load(this.pagination().page, this.pagination().limit);
        },
        error: () => this.snackBar.open('Error al eliminar hilo', 'OK', { duration: 3000 }),
      });
    });
  }
}
