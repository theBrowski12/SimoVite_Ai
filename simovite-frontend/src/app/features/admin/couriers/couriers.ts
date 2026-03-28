import { Component, OnInit } from '@angular/core';
import { Courier } from '../../../models/courrier.model';
@Component({
  selector: 'app-admin-couriers',
  standalone: false,
  templateUrl: './couriers.html',
  styleUrl: './couriers.scss',
})
export class AdminCouriers implements OnInit {
  couriers:Courier[]=[];
  filtered:Courier[]=[];
  loading=true; filterStatus=''; filterVehicle=''; searchTerm='';
  private mock:Courier[]=[
    { id:'0cb58ccd', name:'Mohamed Ben Bouazza', email:'mbenbouazza@gmail.com', vehicleType:'MOTORCYCLE', totalDeliveries:284, rating:4.8, completionRate:96, earnings:8420, online:true,  lastSeen:'Now' },
    { id:'3fa2b1cc', name:'Yassine Amrani',       email:'yamrani@gmail.com',     vehicleType:'CAR',        totalDeliveries:157, rating:4.6, completionRate:91, earnings:4710, online:true,  lastSeen:'2 min ago' },
    { id:'7dc3e4aa', name:'Karim Saidi',          email:'ksaidi@gmail.com',      vehicleType:'BICYCLE',    totalDeliveries:89,  rating:4.3, completionRate:84, earnings:2670, online:false, lastSeen:'3h ago' },
  ];
  ngOnInit():void { setTimeout(()=>{ this.couriers=this.mock; this.filtered=this.mock; this.loading=false; },400); }
  applyFilters():void {
    this.filtered=this.couriers.filter(c=>
      (!this.filterStatus  || (this.filterStatus==='online'?c.online:!c.online)) &&
      (!this.filterVehicle || c.vehicleType===this.filterVehicle) &&
      (!this.searchTerm    || c.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }
  getVehicleClass(v:string):string {
    const m:Record<string,string>={MOTORCYCLE:'badge-orange',CAR:'badge-blue',BICYCLE:'badge-purple',TRUCK:'badge-gray'};
    return m[v]??'badge-gray';
  }
  getVehicleIcon(v:string):string { const m:Record<string,string>={MOTORCYCLE:'🛵',CAR:'🚗',BICYCLE:'🚲',TRUCK:'🚛'}; return m[v]??'🛵'; }
  getInitials(name:string):string { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2); }
  reset():void { this.filterStatus=''; this.filterVehicle=''; this.searchTerm=''; this.applyFilters(); }
}
