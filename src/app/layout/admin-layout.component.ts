import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
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

    /* --- Sidebar --- */
    .sidenav {
      width: 240px;
      background: #1a1a2e;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease, transform 0.25s ease;
      overflow: hidden;
      flex-shrink: 0;
    }
    .sidenav.collapsed {
      width: 60px;
    }
    .sidenav.collapsed .nav-label,
    .sidenav.collapsed .logo-text { display: none; }
    .sidenav.collapsed .logo { padding: 1rem 0; justify-content: center; }
    .sidenav.collapsed .nav-item { justify-content: center; padding: 0.75rem 0; }

    .logo {
      padding: 1.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #c9a84c;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-list {
      flex: 1;
      padding: 0.5rem 0;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(201,168,76,0.3) transparent;
    }
    .nav-list::-webkit-scrollbar { width: 4px; }
    .nav-list::-webkit-scrollbar-track { background: transparent; }
    .nav-list::-webkit-scrollbar-thumb {
      background: rgba(201,168,76,0.3);
      border-radius: 4px;
    }
    .nav-list::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.5); }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #a0a0b8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .nav-item.active { background: rgba(201,168,76,0.12); color: #c9a84c; }

    /* --- Main area --- */
    .main { flex: 1; display: flex; flex-direction: column; background: #f5f5f7; min-width: 0; }
    .topbar {
      height: 56px;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 1rem;
    }
    .topbar-start { margin-right: auto; display: flex; align-items: center; }
    .hamburger { display: none; }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: #666;
    }
    .breadcrumb a {
      color: var(--admin-accent, #c9a84c);
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }
    .breadcrumb-sep { font-size: 1rem; color: #ccc; }
    .admin-name { font-size: 0.85rem; color: #666; }
    .content { flex: 1; padding: 1.5rem; overflow-y: auto; }

    /* --- Mobile overlay --- */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 99;
    }

    /* --- Responsive --- */
    @media (max-width: 1024px) {
      .sidenav {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
      }
      .sidenav.collapsed { width: 240px; transform: translateX(-100%); }
      .sidenav.mobile-open { transform: translateX(0); width: 240px; }
      .sidenav.mobile-open .nav-label,
      .sidenav.mobile-open .logo-text { display: inline; }
      .sidenav.mobile-open .logo { justify-content: flex-start; padding: 1.5rem; }
      .sidenav.mobile-open .nav-item { justify-content: flex-start; padding: 0.75rem 1.5rem; }
      .overlay.visible { display: block; }
      .hamburger { display: inline-flex; }
      .collapse-toggle { display: none; }
    }
  `],
  template: `
    <div class="shell">
      <div class="overlay" [class.visible]="mobileOpen()" (click)="closeMobile()"></div>
      <aside class="sidenav" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
        <div class="logo">
          <mat-icon>auto_stories</mat-icon>
          <span class="logo-text">PlotCraft Admin</span>
        </div>
        <nav class="nav-list">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>dashboard</mat-icon> <span class="nav-label">Dashboard</span>
          </a>
          <a class="nav-item" routerLink="/features" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>toggle_on</mat-icon> <span class="nav-label">Feature Flags</span>
          </a>
          <a class="nav-item" routerLink="/audit-logs" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>history</mat-icon> <span class="nav-label">Audit Logs</span>
          </a>
          <a class="nav-item" routerLink="/users" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>people</mat-icon> <span class="nav-label">Usuarios</span>
          </a>
          <a class="nav-item" routerLink="/communities" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>groups</mat-icon> <span class="nav-label">Comunidades</span>
          </a>
          <a class="nav-item" routerLink="/novels" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>menu_book</mat-icon> <span class="nav-label">Novelas</span>
          </a>
          <a class="nav-item" routerLink="/forum" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>forum</mat-icon> <span class="nav-label">Foro</span>
          </a>
          <a class="nav-item" routerLink="/catalogs" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>category</mat-icon> <span class="nav-label">Catalogos</span>
          </a>
          <a class="nav-item" routerLink="/posts" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>article</mat-icon> <span class="nav-label">Posts</span>
          </a>
          <a class="nav-item" routerLink="/analytics" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>analytics</mat-icon> <span class="nav-label">Analytics</span>
          </a>
          <a class="nav-item" routerLink="/cleanup" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>delete_sweep</mat-icon> <span class="nav-label">Limpieza</span>
          </a>
          <a class="nav-item" routerLink="/settings" routerLinkActive="active" (click)="closeMobile()">
            <mat-icon>settings</mat-icon> <span class="nav-label">Configuracion</span>
          </a>
        </nav>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="topbar-start">
            <button class="hamburger" mat-icon-button (click)="toggleMobile()" aria-label="Abrir menu">
              <mat-icon>menu</mat-icon>
            </button>
            <button class="collapse-toggle" mat-icon-button (click)="toggleCollapse()" aria-label="Colapsar sidebar">
              <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          </div>
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/dashboard">Inicio</a>
            <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
            <span>{{ pageTitle() }}</span>
          </nav>
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  collapsed = signal(false);
  mobileOpen = signal(false);
  pageTitle = signal('Dashboard');

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }
        return child?.snapshot.data['title'] ?? '';
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(title => this.pageTitle.set(title));
  }

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }

  toggleMobile() {
    this.mobileOpen.update(v => !v);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }
}
