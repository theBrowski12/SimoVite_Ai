import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Address } from '../../../models/address.model';
import { PaymentMethod, OrderRequestDto } from '../../../models/order.model';
import * as L from 'leaflet';

// 🛠️ Fix pour l'icône Leaflet
const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector:    'app-checkout',
  standalone:  false,
  templateUrl: './checkout.html',
  styleUrls:   ['./checkout.scss']
})
export class Checkout implements OnInit, AfterViewInit {

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

  // ── Map State ─────────────────────────────────────────────
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  constructor(
    public  cartSvc:  CartService,
    private orderSvc: OrderService,
    private auth:     AuthService,
    private router:   Router,
    private cdr:      ChangeDetectorRef // 👈 Import crucial pour forcer la maj UI
  ) {}

  ngOnInit(): void {
    if (this.cartSvc.count === 0) {
      this.router.navigate(['/categories']);
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    if (this.map) {
      this.map.remove(); // Sécurité comme dans admin-stores
    }

    const defaultLat = 33.5731;
    const defaultLng = -7.5898;

    this.map = L.map('checkout-map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

    // 🛠️ Écouteur de clic sur la carte
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.address.latitude = e.latlng.lat;
      this.address.longitude = e.latlng.lng;
      this.updateMarker(e.latlng.lat, e.latlng.lng);
      
      // 👈 FORCE Angular à vérifier les variables et mettre à jour le HTML (Bouton, Textes)
      this.cdr.detectChanges(); 
    });
  }

  private updateMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
    
    this.map.setView([lat, lng], 15);
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.address.latitude = position.coords.latitude;
          this.address.longitude = position.coords.longitude;
          this.updateMarker(this.address.latitude, this.address.longitude);
          
          // 👈 FORCE Angular à mettre à jour l'UI après la géolocalisation
          this.cdr.detectChanges(); 
        },
        (error) => {
          console.error("Error getting location", error);
          this.error = "Could not get location. Please allow location access.";
          this.cdr.detectChanges(); // 👈 Afficher l'erreur immédiatement
        }
      );
    } else {
      this.error = "Geolocation is not supported by this browser.";
      this.cdr.detectChanges();
    }
  }

  // 💡 BONUS : Ajout de la recherche d'adresse de ton composant admin adaptée ici
  async searchAddress(query: string): Promise<void> {
    if (!query || query.trim() === '') return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        this.address.latitude = lat;
        this.address.longitude = lon;
        this.updateMarker(lat, lon);
        
        // 👈 Forcer l'affichage
        this.cdr.detectChanges();
      } else {
        alert("Adresse introuvable. Essayez d'ajouter la ville.");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche d'adresse :", error);
    }
  }

  // ── Getters ───────────────────────────────────────────────

  get store()    { return this.cartSvc.store; }
  get items()    { return this.cartSvc.items; }
  get subtotal() { return this.cartSvc.total; }
  get isFormValid(): boolean {
    const isAddressValid = !!this.address.city.trim()   &&
                           !!this.address.street.trim() &&
                           !!this.store                 &&
                           this.address.latitude !== 0;

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

  async placeOrder(): Promise<void> {
    if (!this.isFormValid || this.submitting) return;

    // Check if user is logged in
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    this.submitting = true;
    this.error      = '';

    const dto: OrderRequestDto = {
      storeId:         this.store!.id,
      paymentMethod:   this.paymentMethod,
      isPaid:          false,
      deliveryAddress: this.address,
      items:           this.items.map(i => ({
        productId: i.product.id,
        quantity:  i.quantity,
      })),
    };

    this.orderSvc.create(dto).subscribe({
      next: order => {
        if (this.paymentMethod === 'ONLINE_PAYMENT') {
          this.orderSvc.confirmPayment(+order.id).subscribe({
            next: (paidOrder) => {
              this.cartSvc.clear();
              this.submitting = false;
              this.router.navigate(['/orders', paidOrder.orderRef || order.orderRef]);
            },
            error: payErr => {
              console.error('Payment failed', payErr);
              this.error = 'Order created, but payment failed. Please contact support.';
              this.submitting = false;
              this.cdr.detectChanges(); // 👈 Maj de l'erreur UI
            }
          });
        } else {
          this.cartSvc.clear();
          this.submitting = false;
          this.router.navigate(['/orders', order.orderRef]);
        }
      },
      error: err => {
        console.error(err);
        this.error      = 'Order creation failed. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges(); // 👈 Maj de l'erreur UI
      }
    });
  }

  cancelCheckout(): void {
    this.router.navigate(['/store', this.store?.id]);
  }
}