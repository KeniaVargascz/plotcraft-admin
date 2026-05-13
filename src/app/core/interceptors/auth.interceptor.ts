import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const LOGIN_FLOW_PATHS = [
  '/admin/auth/login',
  '/admin/auth/send-otp',
  '/admin/auth/verify-otp',
  '/admin/auth/register-phone',
  '/admin/auth/forgot-password',
  '/admin/auth/reset-password',
  '/auth/refresh',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('admin_access_token');

  if (token && token !== 'undefined' && token !== 'null') {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const isLoginFlow = LOGIN_FLOW_PATHS.some((p) => req.url.includes(p));

      if (error.status === 401 && !isLoginFlow) {
        // Try refreshing the token
        return authService.refreshToken().pipe(
          switchMap((newToken) => {
            // Retry original request with new token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
          catchError(() => {
            // Refresh failed — session expired
            authService.logout();
            return throwError(() => error);
          }),
        );
      }

      if (error.status === 403 && !isLoginFlow) {
        authService.logout();
      }

      return throwError(() => error);
    }),
  );
};
