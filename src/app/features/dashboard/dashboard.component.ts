import { Component, OnInit, AfterViewInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpApiService } from '../../core/services/http-api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface GrowthPoint {
  date: string;
  users: number;
  novels: number;
  chapters: number;
  posts: number;
}

interface Stats {
  users: number;
  novels: number;
  chapters: number;
  worlds: number;
  characters: number;
  communities: number;
  posts: number;
  forumThreads: number;
}

interface Activity {
  period: string;
  newUsers: number;
  newNovels: number;
  newChapters: number;
  newPosts: number;
  newCommunities: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
    .metric-icon { color: #c9a84c; }
    h2 { font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 1rem; color: #1a1a2e; }
    .activity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }
    .activity-card {
      padding: 1rem;
      border-radius: 0.75rem;
      background: #fff;
      border: 1px solid #e8e8ec;
      text-align: center;
    }
    .activity-value { font-size: 1.5rem; font-weight: 700; color: #c9a84c; }
    .activity-label { font-size: 0.8rem; color: #888; margin-top: 0.25rem; }
    .loading { display: grid; place-items: center; padding: 4rem; }
    .chart-section { margin-top: 2rem; }
    .chart-container {
      background: #fff;
      border: 1px solid #e8e8ec;
      border-radius: 1rem;
      padding: 1.25rem;
    }
    canvas { width: 100% !important; max-height: 320px; }
  `],
  template: `
    <h1>Dashboard</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner /></div>
    } @else {
      <div class="metrics-grid">
        @for (m of metrics(); track m.label) {
          <div class="metric-card">
            <div class="metric-label">{{ m.label }}</div>
            <div class="metric-value">{{ m.value | number }}</div>
          </div>
        }
      </div>
      <h2>Actividad (ultimos 7 dias)</h2>
      <div class="activity-grid">
        @for (a of activityCards(); track a.label) {
          <div class="activity-card">
            <div class="activity-value">+{{ a.value }}</div>
            <div class="activity-label">{{ a.label }}</div>
          </div>
        }
      </div>
      <div class="chart-section">
        <h2>Crecimiento (ultimos 30 dias)</h2>
        <div class="chart-container">
          @if (chartLoading()) {
            <div class="loading"><mat-spinner diameter="32" /></div>
          }
          <canvas #growthCanvas></canvas>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  @ViewChild('growthCanvas') growthCanvas!: ElementRef<HTMLCanvasElement>;
  private readonly api = inject(HttpApiService);
  loading = signal(true);
  chartLoading = signal(true);
  metrics = signal<{ label: string; value: number }[]>([]);
  activityCards = signal<{ label: string; value: number }[]>([]);

  ngOnInit() {
    Promise.all([
      this.api.get<Stats>('/admin/dashboard/stats').toPromise(),
      this.api.get<Activity>('/admin/dashboard/activity', { days: '7' }).toPromise(),
    ]).then(([stats, activity]) => {
      this.metrics.set([
        { label: 'Usuarios', value: stats!.users },
        { label: 'Novelas', value: stats!.novels },
        { label: 'Capitulos', value: stats!.chapters },
        { label: 'Mundos', value: stats!.worlds },
        { label: 'Personajes', value: stats!.characters },
        { label: 'Comunidades', value: stats!.communities },
        { label: 'Posts', value: stats!.posts },
        { label: 'Hilos del foro', value: stats!.forumThreads },
      ]);
      this.activityCards.set([
        { label: 'Nuevos usuarios', value: activity!.newUsers },
        { label: 'Nuevas novelas', value: activity!.newNovels },
        { label: 'Capitulos publicados', value: activity!.newChapters },
        { label: 'Nuevos posts', value: activity!.newPosts },
        { label: 'Nuevas comunidades', value: activity!.newCommunities },
      ]);
      this.loading.set(false);
      // Load growth chart after view renders
      setTimeout(() => this.loadGrowthChart(), 0);
    });
  }

  private loadGrowthChart() {
    this.chartLoading.set(true);
    this.api.get<GrowthPoint[]>('/admin/dashboard/growth', { days: '30' }).subscribe((data) => {
      this.chartLoading.set(false);
      if (!this.growthCanvas) return;
      const ctx = this.growthCanvas.nativeElement.getContext('2d');
      if (!ctx) return;
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((d) => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }),
          datasets: [
            {
              label: 'Usuarios',
              data: data.map((d) => d.users),
              borderColor: '#c9a84c',
              backgroundColor: 'rgba(201,168,76,0.1)',
              tension: 0.3,
              fill: false,
            },
            {
              label: 'Novelas',
              data: data.map((d) => d.novels),
              borderColor: '#4c8bc9',
              backgroundColor: 'rgba(76,139,201,0.1)',
              tension: 0.3,
              fill: false,
            },
            {
              label: 'Capitulos',
              data: data.map((d) => d.chapters),
              borderColor: '#4cc98b',
              backgroundColor: 'rgba(76,201,139,0.1)',
              tension: 0.3,
              fill: false,
            },
            {
              label: 'Posts',
              data: data.map((d) => d.posts),
              borderColor: '#c94c7a',
              backgroundColor: 'rgba(201,76,122,0.1)',
              tension: 0.3,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
          },
          scales: {
            x: { title: { display: true, text: 'Fecha' } },
            y: { title: { display: true, text: 'Cantidad' }, beginAtZero: true },
          },
        },
      });
    });
  }
}
