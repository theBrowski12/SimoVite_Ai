// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CatalogResponseDto } from '../models/catalog.model';
import { StoreResponseDto }   from '../models/store.model';

export interface CartItem {
  product:  CatalogResponseDto;
  quantity: number;
}

export interface CartState {
  store: StoreResponseDto | null;
  items: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private _cart$ = new BehaviorSubject<CartState>({ store: null, items: [] });
  cart$ = this._cart$.asObservable();

  get snapshot(): CartState      { return this._cart$.value; }
  get items():    CartItem[]     { return this._cart$.value.items; }
  get store():    StoreResponseDto | null { return this._cart$.value.store; }

  get count(): number {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  }

  get total(): number {
    return this.items.reduce((s, i) => s + i.product.basePrice * i.quantity, 0);
  }

  // ── Mutations ─────────────────────────────────────────────

  setStore(store: StoreResponseDto): void {
    // If switching store, clear previous cart
    if (this.store && this.store.id !== store.id) {
      this._cart$.next({ store, items: [] });
    } else {
      this._cart$.next({ ...this.snapshot, store });
    }
  }

  add(product: CatalogResponseDto): void {
    if (!product.available) return;
    const items   = [...this.items];
    const existing = items.find(i => i.product.id === product.id);
    if (existing) existing.quantity++;
    else          items.push({ product, quantity: 1 });
    this._cart$.next({ ...this.snapshot, items });
  }

  remove(productId: string): void {
    this._cart$.next({
      ...this.snapshot,
      items: this.items.filter(i => i.product.id !== productId)
    });
  }

  updateQty(productId: string, delta: number): void {
    const items = this.items.map(i =>
      i.product.id === productId
        ? { ...i, quantity: Math.max(1, i.quantity + delta) }
        : i
    );
    this._cart$.next({ ...this.snapshot, items });
  }

  getQty(productId: string): number {
    return this.items.find(i => i.product.id === productId)?.quantity ?? 0;
  }

  isInCart(productId: string): boolean {
    return this.items.some(i => i.product.id === productId);
  }

  clear(): void {
    this._cart$.next({ store: null, items: [] });
  }
}