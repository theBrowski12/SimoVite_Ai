import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService }  from '../../../services/order.service';
import { CartService }   from '../../../services/cart.service';
import { AuthService }   from '../../../core/auth/auth.service';
import { Address }       from '../../../models/address.model';
import { PaymentMethod, OrderRequestDto } from '../../../models/order.model';

@Component({
  selector:    'app-checkout',
  standalone:  false,
  templateUrl: './checkout.html',
  styleUrls:   ['./checkout.scss']
})
export class Checkout implements OnInit {

  // ── Form state ────────────────────────────────────────────
  paymentMethod: PaymentMethod = 'CASH_ON_DELIVERY';
  address: Address = {
    city:           '',
    street:         '',
    buildingNumber: '',
    apartment:      '',
    latitude:       0,
    longitude:      0,
  };
  ccNumber = '';
  ccName   = '';
  ccExpiry = '';
  ccCvv    = '';

  submitting = false;
  error      = '';

  constructor(
    public  cartSvc:  CartService,
    private orderSvc: OrderService,
    private auth:     AuthService,
    private router:   Router,
  ) {}

  ngOnInit(): void {
    // Redirect if cart is empty
    if (this.cartSvc.count === 0) {
      this.router.navigate(['/client/categories']);
    }
  }
    getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.address.latitude = position.coords.latitude;
          this.address.longitude = position.coords.longitude;
        },
        (error) => {
          console.error("Error getting location", error);
          this.error = "Could not get location. Please allow location access.";
        }
      );
    } else {
      this.error = "Geolocation is not supported by this browser.";
    }
  }

  // ── Getters ───────────────────────────────────────────────

  get store()    { return this.cartSvc.store; }
  get items()    { return this.cartSvc.items; }
  get subtotal() { return this.cartSvc.total; }
  get isFormValid(): boolean {
    const isAddressValid = !!this.address.city.trim()   &&
                           !!this.address.street.trim() &&
                           !!this.store;

    if (this.paymentMethod === 'ONLINE_PAYMENT') {
      const isCardValid = !!this.ccNumber.trim() && 
                          !!this.ccName.trim()   && 
                          !!this.ccExpiry.trim() && 
                          !!this.ccCvv.trim();
      return isAddressValid && isCardValid;
    }

    return isAddressValid;
  }

  // ── Place order ───────────────────────────────────────────

  placeOrder(): void {
    if (!this.isFormValid || this.submitting) return;

    this.submitting = true;
    this.error      = '';

    const dto: OrderRequestDto = {
      storeId:         this.store!.id,
      paymentMethod:   this.paymentMethod,
      isPaid:          false, // Will be updated automatically by confirmPayment if online
      deliveryAddress: this.address,
      items:           this.items.map(i => ({
        productId: i.product.id,
        quantity:  i.quantity,
      })),
    };

    // 1. Create the Order
    this.orderSvc.create(dto).subscribe({
      next: order => {
        
        if (this.paymentMethod === 'ONLINE_PAYMENT') {
          // 2. If Online, confirm the payment using the new order's ID
          this.orderSvc.confirmPayment(+order.id).subscribe({
            next: (paidOrder) => {
              this.cartSvc.clear();
              this.submitting = false;
              // Go directly to tracking after successful payment
              this.router.navigate(['/orders', paidOrder.orderRef || order.orderRef]);
            },
            error: payErr => {
              console.error('Payment failed', payErr);
              this.error = 'Order created, but payment failed. Please contact support.';
              this.submitting = false;
            }
          });
        } else {
          // COD — go directly to tracking
          this.cartSvc.clear();
          this.submitting = false;
          this.router.navigate(['/orders', order.orderRef]);
        }
      },
      error: err => {
        console.error(err);
        this.error      = 'Order creation failed. Please try again.';
        this.submitting = false;
      }
    });
  }

  cancelCheckout(): void {
    this.router.navigate(['/store', this.store?.id]);
  }

  
}