import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '@services/order.service';
import { SpecialDeliveryRequestDto } from '@models/order.model';
import { KeycloakService } from '@core/auth/keycloak.service';

@Component({
  selector: 'app-special-delivery',
  standalone: false,
  templateUrl: './special-delivery.html',
  styleUrls: ['./special-delivery.scss'],
})
export class SpecialDelivery implements OnInit {
  deliveryForm!: FormGroup;
  
  storeId: string = '';
  catalogSpecialDeliveryId: string = '';

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderSvc: OrderService,
    private keycloakService: KeycloakService
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
      pickUpLatitude: [0],
      pickUpLongitude: [0],

      // Receiver
      receiverName: ['', Validators.required],
      receiverPhone: ['', [Validators.required, Validators.pattern('^[0-9+ ]+$')]],
      
      // Drop-off Address
      dropOffStreet: ['', Validators.required],
      dropOffCity: ['', Validators.required],
      dropOffBuildingNumber: [''],
      dropOffApartment: [''],
      dropOffLatitude: [0],
      dropOffLongitude: [0],

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
      const userId = this.keycloakService.getUserId();

      if (fullName) {
        this.deliveryForm.patchValue({ senderName: fullName });
      }

      if (userId) {
        const phone = await this.keycloakService.getUserPhone(userId);
        if (phone) {
          this.deliveryForm.patchValue({ senderPhone: phone });
        }
      }
    }
  }

  onSubmit(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValues = this.deliveryForm.value;

    const photoUrlsArray = formValues.productPhotoUrls
      ? formValues.productPhotoUrls.split(',').map((url: string) => url.trim()).filter((url: string) => url !== '')
      : [];

    // Mapping exactly to your required structure
    const requestDto: SpecialDeliveryRequestDto = {
      catalogSpecialDeliveryId: this.catalogSpecialDeliveryId,
      productName: formValues.productName,
      storeId: this.storeId,
      
      pickupAddress: {
        street: formValues.pickUpStreet,
        city: formValues.pickUpCity,
        buildingNumber: formValues.pickUpBuildingNumber || '',
        apartment: formValues.pickUpApartment || '',
        latitude: formValues.pickUpLatitude || 0,
        longitude: formValues.pickUpLongitude || 0
      },
      dropoffAddress: {
        street: formValues.dropOffStreet,
        city: formValues.dropOffCity,
        buildingNumber: formValues.dropOffBuildingNumber || '',
        apartment: formValues.dropOffApartment || '',
        latitude: formValues.dropOffLatitude || 0,
        longitude: formValues.dropOffLongitude || 0
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
        this.router.navigate(['/orders', response.id]); 
      },
      error: (err) => {
        console.error('Delivery booking failed', err);
        this.errorMessage = 'Failed to book delivery. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/store', this.storeId]);
  }
}