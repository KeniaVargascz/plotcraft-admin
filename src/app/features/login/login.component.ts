import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  styles: [`
    .login-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #1a1a2e;
    }
    .login-card {
      width: min(420px, 90vw);
      padding: 2.5rem;
      border-radius: 1.25rem;
      background: #16213e;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .logo {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #c9a84c;
      margin-bottom: 2rem;
    }
    .form-stack { display: grid; gap: 1.25rem; }
    .error-msg {
      color: #ef5350;
      font-size: 0.85rem;
      text-align: center;
      margin-top: 0.5rem;
    }
    mat-form-field { width: 100%; }
    .submit-btn {
      width: 100%;
      height: 44px;
      background: #c9a84c !important;
      color: #1a1a2e !important;
      font-weight: 600;
      border-radius: 0.75rem;
    }
  `],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">PlotCraft Admin</div>
        <form class="form-stack" (ngSubmit)="onLogin()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password" name="password" required />
            <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
              <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading()">
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              Iniciar sesion
            }
          </button>
          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  onLogin() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Error al iniciar sesion');
      },
    });
  }
}
