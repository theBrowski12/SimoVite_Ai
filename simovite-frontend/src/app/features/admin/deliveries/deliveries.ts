import { Component, OnInit } from '@angular/core';

interface Delivery {
  id: number;
  orderRef: string;
  courierName: string;
  vehicleType: string;
  distanceInKm: number;
  deliveryCost: number;
  estimatedTimeInMinutes: number;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';
  cashOnDelivery: boolean;
  amountToCollect: number;
  pickupCity: string;
  dropoffCity: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-deliveries',
  standalone: false,
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.scss']
})
export class AdminDeliveries implements OnInit {

  deliveries: Delivery[] = [];
  filtered: Delivery[] = [];
  loading = true;
  filterStatus = '';
  filterVehicle = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  private mock: Delivery[] = [
    { id:1, orderRef:'SV20260320001', courierName:'Mohamed B.', vehicleType:'MOTORCYCLE', distanceInKm:5.1,  deliveryCost:20.22, estimatedTimeInMinutes:18, status:'DELIVERED', cashOnDelivery:true,  amountToCollect:107.72, pickupCity:'Casablanca', dropoffCity:'Casablanca', createdAt:'2026-03-20T09:14:00' },
    { id:2, orderRef:'SV20260320002', courierName:'Yassine A.', vehicleType:'CAR',        distanceInKm:3.4,  deliveryCost:16.80, estimatedTimeInMinutes:22, status:'ASSIGNED',  cashOnDelivery:false, amountToCollect:0,      pickupCity:'Casablanca', dropoffCity:'Ain Sebaa',  createdAt:'2026-03-20T09:32:00' },
    { id:3, orderRef:'SV20260320003', courierName:'—',          vehicleType:'—',          distanceInKm:7.2,  deliveryCost:24.40, estimatedTimeInMinutes:0,  status:'PENDING',   cashOnDelivery:true,  amountToCollect:344.40, pickupCity:'Casablanca', dropoffCity:'Hay Hassani', createdAt:'2026-03-20T09:45:00' },
    { id:4, orderRef:'SV20260320004', courierName:'Karim S.',   vehicleType:'BICYCLE',    distanceInKm:1.8,  deliveryCost:11.60, estimatedTimeInMinutes:12, status:'PICKED_UP', cashOnDelivery:false, amountToCollect:0,      pickupCity:'Casablanca', dropoffCity:'Casablanca', createdAt:'2026-03-20T10:02:00' },
  ];

  ngOnInit(): void {
    // TODO: inject DeliveryService
    setTimeout(() => { this.deliveries = this.mock; this.filtered = this.mock; this.loading = false; }, 400);
  }

  applyFilters(): void {
    this.filtered = this.deliveries.filter(d =>
      (!this.filterStatus  || d.status      === this.filterStatus) &&
      (!this.filterVehicle || d.vehicleType === this.filterVehicle) &&
      (!this.searchTerm    || d.orderRef.toLowerCase().includes(this.searchTerm.toLowerCase()) || d.courierName.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.currentPage = 1;
  }

  get paginated(): Delivery[] { return this.filtered.slice((this.currentPage-1)*this.pageSize, this.currentPage*this.pageSize); }
  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i+1); }

  kpis(status: string): number { return this.deliveries.filter(d => d.status === status).length; }

  getStatusClass(s: string): string {
    const m: Record<string,string> = { PENDING:'badge-gray', ASSIGNED:'badge-orange', PICKED_UP:'badge-blue', DELIVERED:'badge-green' };
    return m[s] ?? 'badge-gray';
  }
  getVehicleIcon(v: string): string {
    const m: Record<string,string> = { MOTORCYCLE:'🛵', CAR:'🚗', BICYCLE:'🚲', TRUCK:'🚛' };
    return m[v] ?? '—';
  }
  reset(): void { this.filterStatus = ''; this.filterVehicle = ''; this.searchTerm = ''; this.applyFilters(); }
}
