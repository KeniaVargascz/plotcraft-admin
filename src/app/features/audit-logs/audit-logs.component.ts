import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
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
  imports: [DatePipe, JsonPipe, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatChipsModule],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
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
    }
    .loading { display: grid; place-items: center; padding: 4rem; }
  `],
  template: `
    <h1>Audit Logs</h1>
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
              <span class="details-json">{{ log.details ? (log.details | json) : '-' }}</span>
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
  columns = ['createdAt', 'adminEmail', 'action', 'resourceType', 'resourceId', 'details'];

  ngOnInit() {
    this.load(1, 20);
  }

  load(page: number, limit: number) {
    this.loading.set(true);
    this.api.get<AuditResponse>('/admin/audit-logs', {
      page: String(page),
      limit: String(limit),
    }).subscribe((res) => {
      this.logs.set(res.data);
      this.pagination.set(res.pagination);
      this.loading.set(false);
    });
  }

  onPage(event: PageEvent) {
    this.load(event.pageIndex + 1, event.pageSize);
  }
}
