import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        data: { title: 'Dashboard' },
      },
      {
        path: 'features',
        loadComponent: () =>
          import('./features/feature-flags/feature-flags.component').then((m) => m.FeatureFlagsComponent),
        data: { title: 'Feature Flags' },
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
        data: { title: 'Audit Logs' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
        data: { title: 'Usuarios' },
      },
      {
        path: 'communities',
        loadComponent: () =>
          import('./features/communities/communities.component').then((m) => m.CommunitiesComponent),
        data: { title: 'Comunidades' },
      },
      {
        path: 'novels',
        loadComponent: () =>
          import('./features/novels/novels.component').then((m) => m.NovelsComponent),
        data: { title: 'Novelas' },
      },
      {
        path: 'forum',
        loadComponent: () =>
          import('./features/forum/forum.component').then((m) => m.ForumComponent),
        data: { title: 'Foro' },
      },
      {
        path: 'catalogs',
        loadComponent: () =>
          import('./features/catalogs/catalogs.component').then((m) => m.CatalogsComponent),
        data: { title: 'Catálogos' },
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/posts/posts.component').then((m) => m.PostsComponent),
        data: { title: 'Posts' },
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
        data: { title: 'Analytics' },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        data: { title: 'Configuración' },
      },
      {
        path: 'cleanup',
        loadComponent: () =>
          import('./features/cleanup/cleanup.component').then((m) => m.CleanupComponent),
        data: { title: 'Limpieza' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
