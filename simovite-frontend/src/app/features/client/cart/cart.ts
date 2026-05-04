import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '@services/cart.service';
import { NotificationService } from '@services/notification.service';
import { StoreResponseDto } from '@models/store.model';
import { TranslateService } from '@ngx-translate/core';

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
    private notifSvc: NotificationService,
    private router: Router,
    private translate: TranslateService
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
    const item = this.items.find(i => i.product.id === productId);
    this.cartSvc.remove(productId);
    if (item) {
      this.notifSvc.info(this.translate.instant('cart.item_removed', { name: item.product.name }));
    }
  }

  clearCart(): void {
    if (confirm(this.translate.instant('cart.clear_confirm'))) {
      this.cartSvc.clear();
      this.notifSvc.warning(this.translate.instant('cart.cart_cleared'));
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
