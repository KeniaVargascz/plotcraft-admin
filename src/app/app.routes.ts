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
      },
      {
        path: 'features',
        loadComponent: () =>
          import('./features/feature-flags/feature-flags.component').then((m) => m.FeatureFlagsComponent),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'communities',
        loadComponent: () =>
          import('./features/communities/communities.component').then((m) => m.CommunitiesComponent),
      },
      {
        path: 'novels',
        loadComponent: () =>
          import('./features/novels/novels.component').then((m) => m.NovelsComponent),
      },
      {
        path: 'forum',
        loadComponent: () =>
          import('./features/forum/forum.component').then((m) => m.ForumComponent),
      },
      {
        path: 'catalogs',
        loadComponent: () =>
          import('./features/catalogs/catalogs.component').then((m) => m.CatalogsComponent),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/posts/posts.component').then((m) => m.PostsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
