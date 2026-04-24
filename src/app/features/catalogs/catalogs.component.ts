import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpApiService } from '../../core/services/http-api.service';

interface CatalogItem {
  id: string;
  label: string;
  slug: string;
  isActive: boolean;
}

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [
    FormsModule,
    MatTabsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  styles: [`
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a2e; }
    .add-form {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin: 1rem 0;
      flex-wrap: wrap;
    }
    .add-form mat-form-field { flex: 1; min-width: 180px; }
    .items-list {
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e8e8ec;
      overflow: hidden;
    }
    .item-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #f0f0f2;
      transition: background 0.1s;
    }
    .item-row:last-child { border-bottom: none; }
    .item-row:hover { background: #fafafa; }
    .item-label {
      flex: 1;
      font-size: 0.9rem;
      color: #1a1a2e;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .item-label:hover { background: #f0f0f2; }
    .item-slug {
      font-size: 0.78rem;
      color: #888;
      min-width: 120px;
    }
    .edit-field { width: 200px; }
    .loading { display: grid; place-items: center; padding: 4rem; }
    .empty { text-align: center; padding: 2rem; color: #888; font-size: 0.9rem; }
  `],
  template: `
    <h1>Catalogos</h1>
    <mat-tab-group (selectedIndexChange)="onTabChange($event)">
      @for (tab of tabs; track tab.key) {
        <mat-tab [label]="tab.label">
          <div class="add-form">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput [ngModel]="newLabel()" (ngModelChange)="newLabel.set($event)" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Slug</mat-label>
              <input matInput [ngModel]="newSlug()" (ngModelChange)="newSlug.set($event)" />
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="addItem(tab.key)">
              <mat-icon>add</mat-icon> Agregar
            </button>
          </div>
          @if (loading()) {
            <div class="loading"><mat-spinner /></div>
          } @else if (items().length === 0) {
            <div class="empty">No hay elementos en este catalogo</div>
          } @else {
            <div class="items-list">
              @for (item of items(); track item.id) {
                <div class="item-row">
                  @if (editingId() === item.id) {
                    <mat-form-field class="edit-field" appearance="outline">
                      <input matInput [ngModel]="editLabel()" (ngModelChange)="editLabel.set($event)" />
                    </mat-form-field>
                    <mat-form-field class="edit-field" appearance="outline">
                      <input matInput [ngModel]="editSlug()" (ngModelChange)="editSlug.set($event)" />
                    </mat-form-field>
                    <button mat-icon-button color="primary" (click)="saveEdit(tab.key, item)">
                      <mat-icon>check</mat-icon>
                    </button>
                    <button mat-icon-button (click)="cancelEdit()">
                      <mat-icon>close</mat-icon>
                    </button>
                  } @else {
                    <span class="item-label" (click)="startEdit(item)">{{ item.label }}</span>
                    <span class="item-slug">{{ item.slug }}</span>
                    <mat-slide-toggle
                      [checked]="item.isActive"
                      (change)="toggleActive(tab.key, item)"
                    />
                    <button mat-icon-button color="warn" (click)="deleteItem(tab.key, item)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </mat-tab>
      }
    </mat-tab-group>
  `,
})
export class CatalogsComponent implements OnInit {
  private readonly api = inject(HttpApiService);
  private readonly snackBar = inject(MatSnackBar);

  tabs = [
    { key: 'genres', label: 'Generos' },
    { key: 'languages', label: 'Idiomas' },
    { key: 'warnings', label: 'Warnings' },
    { key: 'romance-genres', label: 'Romance Genres' },
  ];

  loading = signal(false);
  items = signal<CatalogItem[]>([]);
  currentTab = signal('genres');

  newLabel = signal('');
  newSlug = signal('');

  editingId = signal<string | null>(null);
  editLabel = signal('');
  editSlug = signal('');

  ngOnInit() {
    this.loadItems('genres');
  }

  onTabChange(index: number) {
    const key = this.tabs[index].key;
    this.currentTab.set(key);
    this.loadItems(key);
  }

  loadItems(catalog: string) {
    this.loading.set(true);
    this.api.get<CatalogItem[]>(`/admin/catalogs/${catalog}`).subscribe({
      next: (data) => {
        // Normalize languages (name/code) to match label/slug interface
        const normalized = data.map((item: any) => ({
          ...item,
          label: item.label ?? item.name ?? '',
          slug: item.slug ?? item.code ?? '',
        }));
        this.items.set(normalized);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  addItem(catalog: string) {
    const label = this.newLabel().trim();
    const slug = this.newSlug().trim();
    if (!label || !slug) {
      this.snackBar.open('Nombre y slug son requeridos', 'OK', { duration: 2000 });
      return;
    }
    const body = catalog === 'languages' ? { name: label, code: slug } : { label, slug };
    this.api.post(`/admin/catalogs/${catalog}`, body).subscribe({
      next: () => {
        this.snackBar.open('Elemento agregado', 'OK', { duration: 2000 });
        this.newLabel.set('');
        this.newSlug.set('');
        this.loadItems(catalog);
      },
      error: () => this.snackBar.open('Error al agregar', 'OK', { duration: 3000 }),
    });
  }

  startEdit(item: CatalogItem) {
    this.editingId.set(item.id);
    this.editLabel.set(item.label);
    this.editSlug.set(item.slug);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(catalog: string, item: CatalogItem) {
    const label = this.editLabel().trim();
    const slug = this.editSlug().trim();
    if (!label || !slug) {
      this.snackBar.open('Nombre y slug son requeridos', 'OK', { duration: 2000 });
      return;
    }
    const body = catalog === 'languages' ? { name: label, code: slug } : { label, slug };
    this.api.patch(`/admin/catalogs/${catalog}/${item.id}`, body).subscribe({
      next: () => {
        this.snackBar.open('Elemento actualizado', 'OK', { duration: 2000 });
        this.editingId.set(null);
        this.loadItems(catalog);
      },
      error: () => this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 }),
    });
  }

  toggleActive(catalog: string, item: CatalogItem) {
    this.api.patch(`/admin/catalogs/${catalog}/${item.id}`, { isActive: !item.isActive }).subscribe({
      next: () => {
        this.snackBar.open(`"${item.label}": ${item.isActive ? 'desactivado' : 'activado'}`, 'OK', { duration: 2000 });
        this.loadItems(catalog);
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'OK', { duration: 3000 }),
    });
  }

  deleteItem(catalog: string, item: CatalogItem) {
    if (!confirm(`Seguro que quieres eliminar "${item.label}"?`)) return;
    this.api.delete(`/admin/catalogs/${catalog}/${item.id}`).subscribe({
      next: () => {
        this.snackBar.open(`"${item.label}" eliminado`, 'OK', { duration: 2000 });
        this.loadItems(catalog);
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 }),
    });
  }
}
