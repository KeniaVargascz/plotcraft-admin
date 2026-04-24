import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpApiService } from '../../core/services/http-api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface MetricOverview {
  totalUsers: number;
  totalNovels: number;
  totalChapters: number;
  totalPosts: number;
  totalCommunities: number;
  totalThreads: number;
  previousUsers: number;
  previousNovels: number;
  previousChapters: number;
  previousPosts: number;
  previousCommunities: number;
  previousThreads: number;
}

interface TopNovel {
  id: string;
  title: string;
  authorUsername: string;
  views: number;
  kudos: number;
  chapters: number;
  subscribers: number;
}

interface TopAuthor {
  id: string;
  username: string;
  novelsCount: number;
  followersCount: number;
  postsCount: number;
}

interface ContentBreakdown {
  novelsByStatus: Record<string, number>;
  novelsByRating: Record<string, number>;
  novelsByType: Record<string, number>;
  threadsByCategory: Record<string, number>;
}

interface MetricCard {
  label: string;
  value: number;
  previous: number;
  delta: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    DecimalPipe, PercentPipe,
    MatCardModule, MatButtonModule, MatButtonToggleModule,
    MatTableModule, MatIconModule, MatProgressSpinnerModule,
  ],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    h2 { font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 1rem; color: #1a1a2e; }
    .period-selector { margin-bottom: 1.5rem; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      padding: 1.25rem;
      border-radius: 1rem;
      background: #fff;
      border: 1px solid #e8e8ec;
    }
    .metric-label { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 2rem; font-weight: 700; color: #1a1a2e; margin: 0.25rem 0; }
    .metric-delta { font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; }
    .metric-delta.positive { color: #2e7d32; }
    .metric-delta.negative { color: #c62828; }
    .metric-delta mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    .metric-prev { font-size: 0.75rem; color: #aaa; }
    .table-container {
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e8e8ec;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    table { width: 100%; }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .chart-card {
      background: #fff;
      border: 1px solid #e8e8ec;
      border-radius: 1rem;
      padding: 1.25rem;
    }
    .chart-card h3 { font-size: 0.95rem; font-weight: 600; margin: 0 0 1rem; color: #1a1a2e; }
    canvas { width: 100% !important; max-height: 280px; }
    .loading { display: grid; place-items: center; padding: 4rem; }
  `],
  template: `
    <h1>Analytics</h1>

    <div class="period-selector">
      <mat-button-toggle-group [value]="selectedPeriod()" (change)="onPeriodChange($event.value)" hideSingleSelectionIndicator>
        <mat-button-toggle value="7">7 dias</mat-button-toggle>
        <mat-button-toggle value="30">30 dias</mat-button-toggle>
        <mat-button-toggle value="90">90 dias</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="metrics-grid">
        @for (m of metricCards(); track m.label) {
          <div class="metric-card">
            <div class="metric-label">{{ m.label }}</div>
            <div class="metric-value">{{ m.value | number }}</div>
            <div class="metric-delta" [class.positive]="m.delta >= 0" [class.negative]="m.delta < 0">
              <mat-icon>{{ m.delta >= 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              {{ (m.delta >= 0 ? m.delta : -m.delta) | percent:'1.1-1' }}
            </div>
            <div class="metric-prev">Periodo anterior: {{ m.previous | number }}</div>
          </div>
        }
      </div>

      <h2>Top Novelas</h2>
      <div class="table-container">
        <table mat-table [dataSource]="topNovels()">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Titulo</th>
            <td mat-cell *matCellDef="let n">{{ n.title }}</td>
          </ng-container>
          <ng-container matColumnDef="authorUsername">
            <th mat-header-cell *matHeaderCellDef>Autor</th>
            <td mat-cell *matCellDef="let n">{{ n.authorUsername }}</td>
          </ng-container>
          <ng-container matColumnDef="views">
            <th mat-header-cell *matHeaderCellDef>Vistas</th>
            <td mat-cell *matCellDef="let n">{{ n.views | number }}</td>
          </ng-container>
          <ng-container matColumnDef="kudos">
            <th mat-header-cell *matHeaderCellDef>Kudos</th>
            <td mat-cell *matCellDef="let n">{{ n.kudos | number }}</td>
          </ng-container>
          <ng-container matColumnDef="chapters">
            <th mat-header-cell *matHeaderCellDef>Capitulos</th>
            <td mat-cell *matCellDef="let n">{{ n.chapters | number }}</td>
          </ng-container>
          <ng-container matColumnDef="subscribers">
            <th mat-header-cell *matHeaderCellDef>Suscriptores</th>
            <td mat-cell *matCellDef="let n">{{ n.subscribers | number }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="novelColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: novelColumns;"></tr>
        </table>
      </div>

      <h2>Top Autores</h2>
      <div class="table-container">
        <table mat-table [dataSource]="topAuthors()">
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let a">{{ a.username }}</td>
          </ng-container>
          <ng-container matColumnDef="novelsCount">
            <th mat-header-cell *matHeaderCellDef>Novelas</th>
            <td mat-cell *matCellDef="let a">{{ a.novelsCount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="followersCount">
            <th mat-header-cell *matHeaderCellDef>Seguidores</th>
            <td mat-cell *matCellDef="let a">{{ a.followersCount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="postsCount">
            <th mat-header-cell *matHeaderCellDef>Posts</th>
            <td mat-cell *matCellDef="let a">{{ a.postsCount | number }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="authorColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: authorColumns;"></tr>
        </table>
      </div>

      <h2>Distribucion de Contenido</h2>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Novelas por Estado</h3>
          <canvas #statusChart></canvas>
        </div>
        <div class="chart-card">
          <h3>Novelas por Rating</h3>
          <canvas #ratingChart></canvas>
        </div>
        <div class="chart-card">
          <h3>Novelas por Tipo</h3>
          <canvas #typeChart></canvas>
        </div>
        <div class="chart-card">
          <h3>Hilos por Categoria</h3>
          <canvas #categoryChart></canvas>
        </div>
      </div>
    }
  `,
})
export class AnalyticsComponent implements OnInit {
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ratingChart') ratingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart') typeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(HttpApiService);
  private charts: Chart[] = [];

  loading = signal(true);
  selectedPeriod = signal('30');
  metricCards = signal<MetricCard[]>([]);
  topNovels = signal<TopNovel[]>([]);
  topAuthors = signal<TopAuthor[]>([]);
  breakdown = signal<ContentBreakdown | null>(null);

  novelColumns = ['title', 'authorUsername', 'views', 'kudos', 'chapters', 'subscribers'];
  authorColumns = ['username', 'novelsCount', 'followersCount', 'postsCount'];

  private readonly COLORS = [
    '#c9a84c', '#4c8bc9', '#4cc98b', '#c94c7a',
    '#8b4cc9', '#c9784c', '#4cc9c4', '#7ac94c',
  ];

  ngOnInit() {
    this.loadAll();
  }

  onPeriodChange(period: string) {
    this.selectedPeriod.set(period);
    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);
    const days = this.selectedPeriod();

    Promise.all([
      this.api.get<MetricOverview>('/admin/analytics/overview', { days }).toPromise(),
      this.api.get<TopNovel[]>('/admin/analytics/top-novels', { limit: '10' }).toPromise(),
      this.api.get<TopAuthor[]>('/admin/analytics/top-authors', { limit: '10' }).toPromise(),
      this.api.get<ContentBreakdown>('/admin/analytics/content-breakdown').toPromise(),
    ]).then(([overview, novels, authors, breakdown]) => {
      this.metricCards.set(this.buildMetricCards(overview!));
      this.topNovels.set((novels as any[])!.map((n: any) => ({
        id: n.id, title: n.title,
        authorUsername: n.author?.username ?? '',
        views: n.viewsCount ?? 0,
        kudos: n.kudosCount ?? 0,
        chapters: n._count?.chapters ?? 0,
        subscribers: n._count?.subscriptions ?? 0,
      })));
      this.topAuthors.set((authors as any[])!.map((a: any) => ({
        id: a.id, username: a.username,
        novelsCount: a._count?.novels ?? 0,
        followersCount: a._count?.followers ?? 0,
        postsCount: a._count?.posts ?? 0,
      })));
      this.breakdown.set(breakdown!);
      this.loading.set(false);
      setTimeout(() => this.renderCharts(breakdown!), 0);
    });
  }

  private buildMetricCards(o: any): MetricCard[] {
    const m = o.metrics ?? o;
    const build = (label: string, data: any): MetricCard => ({
      label,
      value: data?.current ?? 0,
      previous: data?.previous ?? 0,
      delta: data?.delta ?? 0,
    });
    return [
      build('Nuevos Usuarios', m.newUsers),
      build('Nuevas Novelas', m.newNovels),
      build('Nuevos Capitulos', m.newChapters),
      build('Nuevos Posts', m.newPosts),
    ];
  }

  private renderCharts(b: any) {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const toRecord = (arr: any[], keyField: string) => {
      if (!Array.isArray(arr)) return arr ?? {};
      const map: Record<string, number> = {};
      for (const item of arr) map[item[keyField] ?? 'unknown'] = item.count ?? 0;
      return map;
    };

    this.charts.push(this.createDoughnut(this.statusChartRef, toRecord(b.novelsByStatus, 'status')));
    this.charts.push(this.createDoughnut(this.ratingChartRef, toRecord(b.novelsByRating, 'rating')));
    this.charts.push(this.createDoughnut(this.typeChartRef, toRecord(b.novelsByType, 'type')));
    this.charts.push(this.createDoughnut(this.categoryChartRef, toRecord(b.threadsByCategory, 'category')));
  }

  private createDoughnut(ref: ElementRef<HTMLCanvasElement>, data: Record<string, number>): Chart {
    const ctx = ref.nativeElement.getContext('2d')!;
    const labels = Object.keys(data);
    const values = Object.values(data);
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: this.COLORS.slice(0, labels.length),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } },
        },
      },
    });
  }
}
