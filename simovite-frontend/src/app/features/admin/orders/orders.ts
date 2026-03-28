import { Component, OnInit } from '@angular/core';
import { Order } from '@models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class AdminOrders implements OnInit {

  orders: Order[] = [];
  filtered: Order[] = [];
  loading = true;

  filterStatus     = '';
  filterPayment    = '';
  filterCategory   = '';
  searchTerm       = '';

  // Pagination
  currentPage = 1;
  pageSize    = 10;

  // Mock data — remplace par this.orderService.getAll().subscribe(...)
  private mockOrders: Order[] = [
    {id: '1', 
    orderRef: 'SV20260320001', 
    clientId: 'c1',
    clientName: 'Mohamed B.', 
    storeId: 's1',
    storeName: 'Pizza Maarif', 
    storeCategory: 'RESTAURANT', 
    items: [], // Ajouté pour l'interface
    deliveryAddress: { street: 'Rue 1', city: 'Casablanca' } as any, // Mock rapide
    totalAmount: 87.50, 
    deliveryCost: 20.22, 
    paymentMethod: 'COD', 
    status: 'DELIVERED', 
    createdAt: '2026-03-20T09:14:00' 
  },
    {id: '2', orderRef: 'SV20260320002', clientId: 'c2', clientName: 'Yassine A.', storeId: 's2', storeName: 'PharmaPlus', storeCategory: 'PHARMACY', items: [], deliveryAddress: { street: 'Rue 2', city: 'Casablanca' } as any, totalAmount: 45.00, deliveryCost: 16.80, paymentMethod: 'ONLINE', status: 'ACCEPTED', createdAt: '2026-03-20T09:32:00' },
    {id: '3', orderRef: 'SV20260320003', clientId: 'c3', clientName: 'Karim S.', storeId: 's3', storeName: 'SuperMarket Central', storeCategory: 'SUPERMARKET', items: [], deliveryAddress: { street: 'Rue 3', city: 'Casablanca' } as any, totalAmount: 120.00, deliveryCost: 24.40, paymentMethod: 'COD', status: 'PENDING', createdAt: '2026-03-20T09:45:00' },
    {id: '4', orderRef: 'SV20260320004', clientId: 'c4', clientName: 'Sara L.', storeId: 's4', storeName: 'Express Delivery', storeCategory: 'SPECIAL_DELIVERY', items: [], deliveryAddress: { street: 'Rue 4', city: 'Casablanca' } as any, totalAmount: 200.00, deliveryCost: 30.00, paymentMethod: 'ONLINE', status: 'CANCELLED', createdAt: '2026-03-20T10:02:00' },
  ];

  ngOnInit(): void {
    // TODO: inject OrderService and replace mock
    // this.orderService.getAll().subscribe(o => { this.orders = o; this.applyFilters(); this.loading = false; });
    setTimeout(() => {
      this.orders   = this.mockOrders;
      this.filtered = this.mockOrders;
      this.loading  = false;
    }, 400);
  }

  applyFilters(): void {
    this.filtered = this.orders.filter(o => {
      const matchStatus   = !this.filterStatus   || o.status          === this.filterStatus;
      const matchPayment  = !this.filterPayment  || o.paymentMethod   === this.filterPayment;
      const matchCategory = !this.filterCategory || o.storeCategory   === this.filterCategory;
      const matchSearch   = !this.searchTerm     ||
        o.orderRef.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        o.clientName.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatus && matchPayment && matchCategory && matchSearch;
    });
    this.currentPage = 1;
  }

  get paginated(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages(): number[]    { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { PENDING:'badge-gray', ACCEPTED:'badge-blue', DELIVERED:'badge-green', CANCELLED:'badge-red' };
    return m[s] ?? 'badge-gray';
  }
  getPaymentClass(p: string): string { return p === 'COD' ? 'badge-orange' : 'badge-blue'; }
  getCategoryClass(c: string): string {
    const m: Record<string, string> = { RESTAURANT:'badge-orange', PHARMACY:'badge-green', SUPERMARKET:'badge-blue', SPECIAL_DELIVERY:'badge-purple' };
    return m[c] ?? 'badge-gray';
  }
  countByStatus(status: string): number {
  return this.orders.filter(o => o.status === status).length;
}
  reset(): void { this.filterStatus = ''; this.filterPayment = ''; this.filterCategory = ''; this.searchTerm = ''; this.applyFilters(); }
}
