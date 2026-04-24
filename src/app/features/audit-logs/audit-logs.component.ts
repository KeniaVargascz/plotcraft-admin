import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpApiService } from '../../core/services/http-api.service';

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AuditResponse {
  data: AuditLog[];
  pagination: Pagination;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    DatePipe, JsonPipe, FormsModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule,
  ],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .filters mat-form-field { min-width: 180px; }
    .filter-actions { display: flex; gap: 0.5rem; align-items: center; padding-bottom: 1.25rem; }
    .table-container {
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e8e8ec;
      overflow: hidden;
    }
    table { width: 100%; }
    .action-chip {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .details-json {
      font-family: monospace;
      font-size: 0.72rem;
      color: #666;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
    }
    .details-expanded {
      font-family: monospace;
      font-size: 0.72rem;
      color: #666;
      max-width: 300px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .expand-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      vertical-align: middle;
      margin-right: 0.25rem;
      cursor: pointer;
      color: #888;
    }
    .loading { display: grid; place-items: center; padding: 4rem; }
  `],
  template: `
    <h1>Audit Logs</h1>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Accion</mat-label>
        <mat-select [(ngModel)]="filterAction">
          <mat-option value="">Todas</mat-option>
          @for (a of actionOptions; track a) {
            <mat-option [value]="a">{{ a }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Tipo de recurso</mat-label>
        <mat-select [(ngModel)]="filterResourceType">
          <mat-option value="">Todos</mat-option>
          @for (r of resourceOptions; track r) {
            <mat-option [value]="r">{{ r }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Desde</mat-label>
        <input matInput type="date" [(ngModel)]="filterDateFrom">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hasta</mat-label>
        <input matInput type="date" [(ngModel)]="filterDateTo">
      </mat-form-field>

      <div class="filter-actions">
        <button mat-raised-button color="primary" (click)="applyFilters()">
          <mat-icon>search</mat-icon> Filtrar
        </button>
        <button mat-stroked-button (click)="clearFilters()">
          <mat-icon>clear</mat-icon> Limpiar
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="table-container">
        <table mat-table [dataSource]="logs()">
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let log">{{ log.createdAt | date:'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="adminEmail">
            <th mat-header-cell *matHeaderCellDef>Admin</th>
            <td mat-cell *matCellDef="let log">{{ log.adminEmail }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Accion</th>
            <td mat-cell *matCellDef="let log">
              <mat-chip class="action-chip">{{ log.action }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="resourceType">
            <th mat-header-cell *matHeaderCellDef>Recurso</th>
            <td mat-cell *matCellDef="let log">{{ log.resourceType }}</td>
          </ng-container>
          <ng-container matColumnDef="resourceId">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let log">{{ log.resourceId || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="details">
            <th mat-header-cell *matHeaderCellDef>Detalles</th>
            <td mat-cell *matCellDef="let log">
              @if (log.details) {
                <mat-icon class="expand-icon" (click)="toggleExpand(log.id)">
                  {{ expandedRows().has(log.id) ? 'expand_less' : 'expand_more' }}
                </mat-icon>
                @if (expandedRows().has(log.id)) {
                  <span class="details-expanded">{{ log.details | json }}</span>
                } @else {
                  <span class="details-json" (click)="toggleExpand(log.id)">{{ log.details | json }}</span>
                }
              } @else {
                -
              }
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
export class AuditLogsComponent implements OnInit {
  private readonly api = inject(HttpApiService);

  loading = signal(true);
  logs = signal<AuditLog[]>([]);
  pagination = signal<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  expandedRows = signal<Set<string>>(new Set());
  columns = ['createdAt', 'adminEmail', 'action', 'resourceType', 'resourceId', 'details'];

  filterAction = '';
  filterResourceType = '';
  filterDateFrom = '';
  filterDateTo = '';

  actionOptions = [
    'CREATE', 'UPDATE', 'DELETE', 'BAN', 'UNBAN', 'SUSPEND',
    'ACTIVATE', 'DEACTIVATE', 'TOGGLE', 'LOGIN',
  ];
  resourceOptions = [
    'USER', 'NOVEL', 'CHAPTER', 'COMMUNITY', 'POST',
    'THREAD', 'COMMENT', 'FEATURE_FLAG', 'SETTING',
  ];

  ngOnInit() {
    this.load(1, 20);
  }

  load(page: number, limit: number) {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (this.filterAction) params['action'] = this.filterAction;
    if (this.filterResourceType) params['resourceType'] = this.filterResourceType;
    if (this.filterDateFrom) params['dateFrom'] = this.filterDateFrom;
    if (this.filterDateTo) params['dateTo'] = this.filterDateTo;

    this.api.get<AuditResponse>('/admin/audit-logs', params).subscribe((res) => {
      this.logs.set(res.data);
      this.pagination.set(res.pagination);
      this.loading.set(false);
    });
  }

  applyFilters() {
    this.load(1, this.pagination().limit);
  }

  clearFilters() {
    this.filterAction = '';
    this.filterResourceType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.load(1, this.pagination().limit);
  }

  toggleExpand(id: string) {
    const current = new Set(this.expandedRows());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedRows.set(current);
  }

  onPage(event: PageEvent) {
    this.load(event.pageIndex + 1, event.pageSize);
  }
}
