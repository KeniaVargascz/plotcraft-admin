import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
  ],
  styles: [`
    .shell { display: flex; height: 100vh; }
    .sidenav {
      width: 240px;
      background: #1a1a2e;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
    }
    .logo {
      padding: 1.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #c9a84c;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .nav-list { flex: 1; padding: 0.5rem 0; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #a0a0b8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .nav-item.active { background: rgba(201,168,76,0.12); color: #c9a84c; }
    .main { flex: 1; display: flex; flex-direction: column; background: #f5f5f7; }
    .topbar {
      height: 56px;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 1.5rem;
      gap: 1rem;
    }
    .admin-name { font-size: 0.85rem; color: #666; }
    .content { flex: 1; padding: 1.5rem; overflow-y: auto; }
  `],
  template: `
    <div class="shell">
      <aside class="sidenav">
        <div class="logo">PlotCraft Admin</div>
        <nav class="nav-list">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a class="nav-item" routerLink="/features" routerLinkActive="active">
            <mat-icon>toggle_on</mat-icon> Feature Flags
          </a>
          <a class="nav-item" routerLink="/audit-logs" routerLinkActive="active">
            <mat-icon>history</mat-icon> Audit Logs
          </a>
          <a class="nav-item" routerLink="/users" routerLinkActive="active">
            <mat-icon>people</mat-icon> Usuarios
          </a>
          <a class="nav-item" routerLink="/communities" routerLinkActive="active">
            <mat-icon>groups</mat-icon> Comunidades
          </a>
          <a class="nav-item" routerLink="/novels" routerLinkActive="active">
            <mat-icon>menu_book</mat-icon> Novelas
          </a>
          <a class="nav-item" routerLink="/forum" routerLinkActive="active">
            <mat-icon>forum</mat-icon> Foro
          </a>
          <a class="nav-item" routerLink="/catalogs" routerLinkActive="active">
            <mat-icon>category</mat-icon> Catalogos
          </a>
          <a class="nav-item" routerLink="/posts" routerLinkActive="active">
            <mat-icon>article</mat-icon> Posts
          </a>
          <a class="nav-item" routerLink="/analytics" routerLinkActive="active">
            <mat-icon>analytics</mat-icon> Analytics
          </a>
          <a class="nav-item" routerLink="/settings" routerLinkActive="active">
            <mat-icon>settings</mat-icon> Configuracion
          </a>
        </nav>
      </aside>
      <div class="main">
        <header class="topbar">
          <span class="admin-name">{{ auth.currentUser()?.profile?.displayName || auth.currentUser()?.username }}</span>
          <button mat-icon-button (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
}
