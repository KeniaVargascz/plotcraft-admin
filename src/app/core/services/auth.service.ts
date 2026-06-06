import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, throwError, timeout, catchError, of, firstValueFrom } from 'rxjs';
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

  readonly sessionReady = signal(false);

  constructor(private http: HttpClient, private router: Router) {}

  async initializeSession(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this.sessionReady.set(true);
      return;
    }

    try {
      const user = await firstValueFrom(
        this.me().pipe(
          timeout(5000),
          catchError(() => of(null)),
        ),
      );
      if (user) {
        this.currentUser.set(user);
      } else {
        this.clearTokens();
      }
    } catch {
      this.clearTokens();
    }

    this.sessionReady.set(true);
  }

  private clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem('admin_tfa_token');
    this.currentUser.set(null);
  }

  login(email: string, password: string): Observable<{ phoneRequired: boolean; tfaEnabled: boolean; allowedChannels: string[]; tfaToken: string }> {
    return this.http
      .post<ApiResponse<{ phoneRequired: boolean; tfaEnabled: boolean; allowedChannels: string[]; tfaToken: string }>>(
        `${environment.apiUrl}/admin/auth/login`,
        { email, password },
      )
      .pipe(map((r) => r.data));
  }

  registerPhone(tfaToken: string, phone: string): Observable<{ registered: boolean }> {
    return this.http
      .post<ApiResponse<{ registered: boolean }>>(
        `${environment.apiUrl}/admin/auth/register-phone`,
        { tfaToken, phone },
      )
      .pipe(map((r) => r.data));
  }

  sendOtp(tfaToken: string, channel: 'sms' | 'whatsapp' | 'email' | 'totp'): Observable<{ sent: boolean }> {
    return this.http
      .post<ApiResponse<{ sent: boolean }>>(
        `${environment.apiUrl}/admin/auth/send-otp`,
        { tfaToken, channel },
      )
      .pipe(map((r) => r.data));
  }

  verifyOtp(tfaToken: string, code: string, channel?: string): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${environment.apiUrl}/admin/auth/verify-otp`,
        { tfaToken, code, channel },
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

  refreshToken(): Observable<string> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${environment.apiUrl}/auth/refresh`,
        { refreshToken },
      )
      .pipe(
        map((r) => r.data),
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
        }),
        map((res) => res.accessToken),
      );
  }

  forgotPassword(email: string, channel: 'sms' | 'whatsapp'): Observable<{ via: 'email' | 'phone' | 'unknown' }> {
    return this.http
      .post<ApiResponse<{ via: 'email' | 'phone' | 'unknown' }>>(
        `${environment.apiUrl}/admin/auth/forgot-password`,
        { email, channel },
      )
      .pipe(map((r) => r.data));
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .post<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/admin/auth/reset-password`,
        { email, code, newPassword },
      )
      .pipe(map((r) => r.data));
  }

  me(): Observable<AdminUser> {
    return this.http
      .get<ApiResponse<AdminUser>>(`${environment.apiUrl}/admin/auth/me`)
      .pipe(map((r) => r.data));
  }

  logout() {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
