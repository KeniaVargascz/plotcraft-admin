import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  role?: number;
  tfaEnabled?: boolean;
  profile?: { displayName: string; avatarUrl: string | null };
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

interface TfaRequiredResponse {
  tfaRequired: true;
  tfaToken: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'admin_access_token';
  private readonly REFRESH_KEY = 'admin_refresh_token';

  readonly currentUser = signal<AdminUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  private loadUser() {
    const token = this.getToken();
    if (token) {
      this.me().subscribe({
        next: (user) => this.currentUser.set(user),
        error: () => this.logout(),
      });
    }
  }

  login(email: string, password: string): Observable<LoginResponse | TfaRequiredResponse> {
    return this.http
      .post<ApiResponse<LoginResponse | TfaRequiredResponse>>(
        `${environment.apiUrl}/admin/auth/login`,
        { email, password },
      )
      .pipe(
        map((r) => r.data),
        tap((res) => {
          if (!('tfaRequired' in res)) {
            const loginRes = res as LoginResponse;
            localStorage.setItem(this.TOKEN_KEY, loginRes.accessToken);
            localStorage.setItem(this.REFRESH_KEY, loginRes.refreshToken);
            this.currentUser.set(loginRes.user);
          }
        }),
      );
  }

  verifyTfa(tfaToken: string, code: string): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${environment.apiUrl}/admin/auth/tfa/verify`,
        { tfaToken, code },
      )
      .pipe(
        map((r) => r.data),
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
          this.currentUser.set(res.user);
        }),
      );
  }

  setupAndEnable(tfaToken: string, code: string, phone: string): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${environment.apiUrl}/admin/auth/tfa/setup-and-enable`,
        { tfaToken, code, phone },
      )
      .pipe(
        map((r) => r.data),
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
          this.currentUser.set(res.user);
        }),
      );
  }

  me(): Observable<AdminUser> {
    return this.http
      .get<ApiResponse<AdminUser>>(`${environment.apiUrl}/admin/auth/me`)
      .pipe(map((r) => r.data));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
