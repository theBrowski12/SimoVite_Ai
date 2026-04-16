import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '@services/order.service';
import { SpecialDeliveryRequestDto } from '@models/order.model';
import { KeycloakService } from '@core/auth/keycloak.service';
import * as L from 'leaflet';

// 🛠️ Leaflet Icon Fix
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
  selector: 'app-special-delivery',
  standalone: false,
  templateUrl: './special-delivery.html',
  styleUrls: ['./special-delivery.scss'],
})
export class SpecialDelivery implements OnInit, AfterViewInit {
  deliveryForm!: FormGroup;
  
  storeId: string = '';
  catalogSpecialDeliveryId: string = '';

  isSubmitting = false;
  errorMessage = '';

  // ── Map State ─────────────────────────────────────────────
  private pickupMap: L.Map | undefined;
  private dropoffMap: L.Map | undefined;
  private pickupMarker: L.Marker | undefined;
  private dropoffMarker: L.Marker | undefined;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderSvc: OrderService,
    private keycloakService: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.storeId = nav.extras.state['storeId'];
      this.catalogSpecialDeliveryId = nav.extras.state['catalogSpecialDeliveryId'];
    }
  }

  ngOnInit(): void {
    if (!this.storeId || !this.catalogSpecialDeliveryId) {
      this.router.navigate(['/']);
      return;
    }
    
    this.initForm();
    this.prefillSenderData();
  }

  ngAfterViewInit(): void {
    // Initialize maps after the DOM is ready
    this.initMaps();
  }

  private initForm(): void {
    this.deliveryForm = this.fb.group({
      // Sender
      senderName: ['', Validators.required],
      senderPhone: ['', [Validators.required, Validators.pattern('^[0-9+ ]+$')]],
      
      // Pickup Address
      pickUpStreet: ['', Validators.required],
      pickUpCity: ['', Validators.required],
      pickUpBuildingNumber: [''],
      pickUpApartment: [''],
      pickUpLatitude: [0, Validators.required], // Mapped to the map
      pickUpLongitude: [0, Validators.required], // Mapped to the map

      // Receiver
      receiverName: ['', Validators.required],
      receiverPhone: ['', [Validators.required, Validators.pattern('^[0-9+ ]+$')]],
      
      // Drop-off Address
      dropOffStreet: ['', Validators.required],
      dropOffCity: ['', Validators.required],
      dropOffBuildingNumber: [''],
      dropOffApartment: [''],
      dropOffLatitude: [0, Validators.required], // Mapped to the map
      dropOffLongitude: [0, Validators.required], // Mapped to the map

      // Package Details
      productName: ['', Validators.required], 
      totalWeightKg: [1, [Validators.required, Validators.min(0.1)]],
      productPhotoUrls: [''],
      instructions: [''],
      
      // Payment
      paymentMethod: ['CASH_ON_DELIVERY', Validators.required]
    });
  }

  private async prefillSenderData(): Promise<void> {
    if (this.keycloakService.isLoggedIn()) {
      const fullName = this.keycloakService.getFullName();
      if (fullName) this.deliveryForm.patchValue({ senderName: fullName });

      const phone = await this.keycloakService.getUserPhone(this.keycloakService.getUserId());
      if (phone) this.deliveryForm.patchValue({ senderPhone: phone });
    }
  }

  // ── Map Initialization ────────────────────────────────────

  private initMaps(): void {
    // Default location (Tangier coordinates)
    const defaultLat = 35.7595;
    const defaultLng = -5.8340;

    // 1. Initialize Pickup Map
    this.pickupMap = L.map('pickup-map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.pickupMap);

    this.pickupMap.on('click', (e: L.LeafletMouseEvent) => {
      this.deliveryForm.patchValue({
        pickUpLatitude: e.latlng.lat,
        pickUpLongitude: e.latlng.lng
      });
      this.updateMarker('pickup', e.latlng.lat, e.latlng.lng);
      this.cdr.detectChanges();
    });

    // 2. Initialize Dropoff Map
    this.dropoffMap = L.map('dropoff-map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.dropoffMap);

    this.dropoffMap.on('click', (e: L.LeafletMouseEvent) => {
      this.deliveryForm.patchValue({
        dropOffLatitude: e.latlng.lat,
        dropOffLongitude: e.latlng.lng
      });
      this.updateMarker('dropoff', e.latlng.lat, e.latlng.lng);
      this.cdr.detectChanges();
    });

    // Fix map rendering sizes
    setTimeout(() => {
      this.pickupMap?.invalidateSize();
      this.dropoffMap?.invalidateSize();
    }, 200);
  }

  private updateMarker(type: 'pickup' | 'dropoff', lat: number, lng: number): void {
    if (type === 'pickup' && this.pickupMap) {
      if (this.pickupMarker) {
        this.pickupMarker.setLatLng([lat, lng]);
      } else {
        this.pickupMarker = L.marker([lat, lng]).addTo(this.pickupMap);
      }
      this.pickupMap.setView([lat, lng], 15);
    } 
    else if (type === 'dropoff' && this.dropoffMap) {
      if (this.dropoffMarker) {
        this.dropoffMarker.setLatLng([lat, lng]);
      } else {
        this.dropoffMarker = L.marker([lat, lng]).addTo(this.dropoffMap);
      }
      this.dropoffMap.setView([lat, lng], 15);
    }
  }

  getCurrentLocation(type: 'pickup' | 'dropoff'): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (type === 'pickup') {
            this.deliveryForm.patchValue({ pickUpLatitude: lat, pickUpLongitude: lng });
          } else {
            this.deliveryForm.patchValue({ dropOffLatitude: lat, dropOffLongitude: lng });
          }

          this.updateMarker(type, lat, lng);
          this.cdr.detectChanges();
        },
        (error) => {
          console.error("Error getting location", error);
          this.errorMessage = "Could not get location. Please allow location access.";
          this.cdr.detectChanges();
        }
      );
    } else {
      this.errorMessage = "Geolocation is not supported by this browser.";
      this.cdr.detectChanges();
    }
  }

  // ── Submit ───────────────────────────────────────────────

  onSubmit(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      // Added a warning if they forgot to click the maps
      if (this.deliveryForm.value.pickUpLatitude === 0 || this.deliveryForm.value.dropOffLatitude === 0) {
        this.errorMessage = 'Please select both pickup and drop-off locations on the maps.';
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValues = this.deliveryForm.value;

    const photoUrlsArray = formValues.productPhotoUrls
      ? formValues.productPhotoUrls.split(',').map((url: string) => url.trim()).filter((url: string) => url !== '')
      : [];

    const requestDto: SpecialDeliveryRequestDto = {
      catalogSpecialDeliveryId: this.catalogSpecialDeliveryId,
      productName: formValues.productName,
      storeId: this.storeId,
      
      pickupAddress: {
        street: formValues.pickUpStreet,
        city: formValues.pickUpCity,
        buildingNumber: formValues.pickUpBuildingNumber || '',
        apartment: formValues.pickUpApartment || '',
        latitude: formValues.pickUpLatitude,
        longitude: formValues.pickUpLongitude
      },
      dropoffAddress: {
        street: formValues.dropOffStreet,
        city: formValues.dropOffCity,
        buildingNumber: formValues.dropOffBuildingNumber || '',
        apartment: formValues.dropOffApartment || '',
        latitude: formValues.dropOffLatitude,
        longitude: formValues.dropOffLongitude
      },
      
      senderId: this.keycloakService.isLoggedIn() ? this.keycloakService.getUserId() : undefined,
      senderName: formValues.senderName,
      senderPhone: formValues.senderPhone,
      receiverName: formValues.receiverName,
      receiverPhone: formValues.receiverPhone,
      
      productPhotoUrls: photoUrlsArray,
      totalWeightKg: formValues.totalWeightKg,
      instructions: formValues.instructions,
      paymentMethod: formValues.paymentMethod
    };

    this.orderSvc.createSpecialDelivery(requestDto).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.router.navigate(['/orders']); 
      },
      error: (err) => {
        console.error('Delivery booking failed', err);
        this.errorMessage = 'Failed to book delivery. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
  // Add this method anywhere in your SpecialDeliveryComponent class
  async searchAddress(query: string, type: 'pickup' | 'dropoff'): Promise<void> {
    if (!query || query.trim() === '') return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (type === 'pickup') {
          this.deliveryForm.patchValue({ pickUpLatitude: lat, pickUpLongitude: lon });
        } else {
          this.deliveryForm.patchValue({ dropOffLatitude: lat, dropOffLongitude: lon });
        }

        this.updateMarker(type, lat, lon);
        this.cdr.detectChanges();
      } else {
        alert("Address not found. Try adding the city name (e.g., 'Avenue Hassan II, Tangier').");
      }
    } catch (error) {
      console.error("Error searching address:", error);
    }
  }

  goBack(): void {
    this.router.navigate(['/store', this.storeId]);
  }
}