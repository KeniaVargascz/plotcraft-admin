import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: 'primary' | 'warn';
  promptLabel?: string;
  promptRequired?: boolean;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="message">{{ data.message }}</p>
      @if (data.promptLabel) {
        <mat-form-field appearance="outline" class="reason-field">
          <mat-label>{{ data.promptLabel }}</mat-label>
          <textarea
            matInput
            rows="2"
            [(ngModel)]="reason"
          ></textarea>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelLabel || 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        [color]="data.color || 'warn'"
        [disabled]="data.promptRequired && !reason().trim()"
        (click)="onConfirm()">
        {{ data.confirmLabel || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .message {
      color: var(--admin-text-secondary, #5a5a72);
      font-size: 0.95rem;
      margin: 0 0 0.5rem;
      line-height: 1.5;
    }
    .reason-field {
      width: 100%;
      margin-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  reason = signal('');

  onCancel() {
    this.dialogRef.close({ confirmed: false } as ConfirmDialogResult);
  }

  onConfirm() {
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason().trim() || undefined,
    } as ConfirmDialogResult);
  }
}
