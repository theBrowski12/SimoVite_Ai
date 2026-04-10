import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '@services/cart.service';
import { StoreResponseDto } from '@models/store.model';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})
export class Cart implements OnInit {
  items: CartItem[] = [];
  store: StoreResponseDto | null = null;
  loading = false;

  constructor(
    private cartSvc: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.items = this.cartSvc.items;
    this.store = this.cartSvc.store;

    // Subscribe to cart changes
    this.cartSvc.cart$.subscribe(state => {
      this.items = state.items;
      this.store = state.store;
    });
  }

  updateQty(productId: string, delta: number): void {
    this.cartSvc.updateQty(productId, delta);
  }

  removeItem(productId: string): void {
    this.cartSvc.remove(productId);
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear the cart?')) {
      this.cartSvc.clear();
    }
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  continueShopping(): void {
    if (this.store) {
      this.router.navigate(['/stores', this.store.id]);
    } else {
      this.router.navigate(['/stores']);
    }
  }

  proceedToCheckout(): void {
    if (!this.store || this.items.length === 0) return;
    this.router.navigate(['/checkout']);
  }
}
