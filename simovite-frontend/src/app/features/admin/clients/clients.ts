import { Component, OnInit } from '@angular/core';

interface Client { id:string; name:string; email:string; totalOrders:number; totalSpent:number; reviewsCount:number; joinedAt:string; }
@Component({ 
  selector:'app-admin-clients',
  standalone:false, 
  templateUrl:'./clients.html', 
  styleUrls:['./clients.scss'] 
})

export class AdminClientsComponent implements OnInit {
  clients:Client[]=[]; filtered:Client[]=[];
  loading=true; searchTerm=''; currentPage=1; pageSize=10;
  private mock:Client[]=[
    { id:'0cb58ccd', name:'Mohamed Ben Bouazza', email:'bambou.simo@gmail.com', totalOrders:12, totalSpent:1840, reviewsCount:4,  joinedAt:'2026-01-10' },
    { id:'3fa2b1cc', name:'Sara Kettani',        email:'sara.k@gmail.com',      totalOrders:7,  totalSpent:920,  reviewsCount:2,  joinedAt:'2026-02-15' },
    { id:'8dc4e3bb', name:'Fatima Zahra',        email:'fatima.z@gmail.com',    totalOrders:24, totalSpent:3210, reviewsCount:11, joinedAt:'2026-01-05' },
    { id:'2cb3d4aa', name:'Khalid Moussaoui',    email:'khalid.m@gmail.com',    totalOrders:3,  totalSpent:410,  reviewsCount:1,  joinedAt:'2026-03-01' },
  ];
  ngOnInit():void { setTimeout(()=>{ this.clients=this.mock; this.filtered=this.mock; this.loading=false; },400); }
  applyFilters():void {
    this.filtered=this.clients.filter(c=>!this.searchTerm||c.name.toLowerCase().includes(this.searchTerm.toLowerCase())||c.email.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.currentPage=1;
  }
  get paginated():Client[]{ return this.filtered.slice((this.currentPage-1)*this.pageSize,this.currentPage*this.pageSize); }
  get totalPages():number { return Math.ceil(this.filtered.length/this.pageSize); }
  get pages():number[]    { return Array.from({length:this.totalPages},(_,i)=>i+1); }
  getInitials(name:string):string { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2); }
}
