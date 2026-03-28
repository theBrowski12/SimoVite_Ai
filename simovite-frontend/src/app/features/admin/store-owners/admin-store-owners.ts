import { Component, OnInit } from '@angular/core';
interface StoreOwner { id:string; name:string; email:string; storeName:string; storeCategory:string; productCount:number; rating:number; storeOpen:boolean; joinedAt:string; }
@Component({ selector:'app-admin-store-owners', standalone:false, templateUrl:'./admin-store-owners.html', styleUrls:['./admin-store-owners.scss'] })
export class AdminStoreOwners implements OnInit {
  owners:StoreOwner[]=[]; filtered:StoreOwner[]=[];
  loading=true; filterCategory=''; searchTerm='';
  private mock:StoreOwner[]=[
    { id:'5ef2c3dd', name:'Ahmed Mansouri', email:'ahmed.m@simovite.com', storeName:'Pizza Maarif',       storeCategory:'RESTAURANT',       productCount:18, rating:4.8, storeOpen:true,  joinedAt:'2025-11-01' },
    { id:'7aa1b2cc', name:'Laila Benali',   email:'laila.b@simovite.com', storeName:'Pharmacie Centrale', storeCategory:'PHARMACY',         productCount:45, rating:4.6, storeOpen:true,  joinedAt:'2025-10-15' },
    { id:'9bc4d5ee', name:'Rachid Karimi',  email:'rachid.k@simovite.com',storeName:'Marjane Maarif',     storeCategory:'SUPERMARKET',      productCount:120,rating:4.3, storeOpen:false, joinedAt:'2025-09-20' },
  ];
  ngOnInit():void { setTimeout(()=>{ this.owners=this.mock; this.filtered=this.mock; this.loading=false; },400); }
  applyFilters():void {
    this.filtered=this.owners.filter(o=>(!this.filterCategory||o.storeCategory===this.filterCategory)&&(!this.searchTerm||o.name.toLowerCase().includes(this.searchTerm.toLowerCase())));
  }
  getCategoryClass(c:string):string {
    const m:Record<string,string>={RESTAURANT:'badge-orange',PHARMACY:'badge-green',SUPERMARKET:'badge-blue',SPECIAL_DELIVERY:'badge-purple'};
    return m[c]??'badge-gray';
  }
  getInitials(name:string):string { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2); }
  reset():void { this.filterCategory=''; this.searchTerm=''; this.applyFilters(); }
}
