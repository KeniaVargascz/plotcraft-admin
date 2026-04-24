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
import { HttpApiService } from '../../core/services/http-api.service';

interface Post {
  id: string;
  author: {
    id: string;
    username: string;
  };
  type: string;
  content: string;
  commentsCount: number;
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

interface PostsResponse {
  data: Post[];
  pagination: Pagination;
}

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatChipsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatMenuModule,
    MatSnackBarModule,
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
    .content-preview {
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.85rem;
      color: #555;
    }
  `],
  template: `
    <h1>Posts</h1>
    <div class="toolbar">
      <mat-form-field class="search-field" appearance="outline">
        <mat-label>Buscar post</mat-label>
        <input matInput [ngModel]="search()" (ngModelChange)="onSearch($event)" placeholder="Contenido, autor..." />
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      <div class="status-filters">
        @for (t of typeOptions; track t) {
          <mat-chip
            class="status-chip"
            [class.selected]="typeFilter() === t"
            (click)="onTypeFilter(t)"
          >{{ t }}</mat-chip>
        }
      </div>
    </div>
    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="table-container">
        <table mat-table [dataSource]="posts()">
          <ng-container matColumnDef="author">
            <th mat-header-cell *matHeaderCellDef>Autor</th>
            <td mat-cell *matCellDef="let p">{{ p.author.username }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip class="chip-status">{{ p.type }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="content">
            <th mat-header-cell *matHeaderCellDef>Contenido</th>
            <td mat-cell *matCellDef="let p">
              <div class="content-preview">{{ p.content }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="commentsCount">
            <th mat-header-cell *matHeaderCellDef>Comentarios</th>
            <td mat-cell *matCellDef="let p">{{ p.commentsCount }}</td>
          </ng-container>
          <ng-container matColumnDef="reactionsCount">
            <th mat-header-cell *matHeaderCellDef>Reacciones</th>
            <td mat-cell *matCellDef="let p">{{ p.reactionsCount }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Creado</th>
            <td mat-cell *matCellDef="let p">{{ p.createdAt | date:'shortDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="deletePost(p)">
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
export class PostsComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  posts = signal<Post[]>([]);
  pagination = signal<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  search = signal('');
  typeFilter = signal('ALL');
  typeOptions = ['ALL', 'TEXT', 'UPDATE', 'SHOWCASE', 'ANNOUNCEMENT', 'QUESTION'];
  columns = ['author', 'type', 'content', 'commentsCount', 'reactionsCount', 'createdAt', 'actions'];

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
    if (this.typeFilter() !== 'ALL') params['type'] = this.typeFilter();

    this.api.get<PostsResponse>('/admin/posts', params).subscribe((res) => {
      this.posts.set(res.data);
      this.pagination.set(res.pagination);
      this.loading.set(false);
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(1, this.pagination().limit), 400);
  }

  onTypeFilter(type: string) {
    this.typeFilter.set(type);
    this.load(1, this.pagination().limit);
  }

  onPage(event: PageEvent) {
    this.load(event.pageIndex + 1, event.pageSize);
  }

  deletePost(post: Post) {
    if (!confirm(`Seguro que quieres eliminar este post de ${post.author.username}? Esta accion no se puede deshacer.`)) return;
    this.api.delete(`/admin/posts/${post.id}`).subscribe({
      next: () => {
        this.snackBar.open('Post eliminado', 'OK', { duration: 2000 });
        this.load(this.pagination().page, this.pagination().limit);
      },
      error: () => this.snackBar.open('Error al eliminar post', 'OK', { duration: 3000 }),
    });
  }
}
