import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({ selector:'app-admin-statistics', 
  standalone:false, 
  templateUrl:'./statistics.html', 
  styleUrls:['./statistics.scss'] })
  
export class AdminStatistics implements OnInit, AfterViewInit {
  kpis = { monthOrders:8420, monthRevenue:384200, avgDeliveryTime:23, repeatRate:68 };
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    setTimeout(() => { this.buildRevenueChart(); this.buildPaymentChart(); this.buildStatusChart(); this.buildClientsChart(); }, 300);
  }
  private buildRevenueChart(): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'bar', data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar'], datasets:[{ label:'Revenue (DH)', data:[210000,245000,312000,290000,354000,384200], backgroundColor:'rgba(255,107,53,.8)', borderRadius:6 }]}, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:(v:any)=>(v/1000)+'k DH'}}, x:{grid:{display:false}} } } });
  }
  private buildPaymentChart(): void {
    const ctx = document.getElementById('paymentChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'doughnut', data:{ labels:['COD','Online'], datasets:[{ data:[58,42], backgroundColor:['#FF6B35','#3B82F6'], borderWidth:0 }]}, options:{ responsive:true, cutout:'65%', plugins:{legend:{position:'bottom'}} } });
  }
  private buildStatusChart(): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'bar', data:{ labels:['PENDING','ASSIGNED','DELIVERED','CANCELLED'], datasets:[{ data:[42,38,6240,88], backgroundColor:['#9ca3af','#FF6B35','#22C55E','#EF4444'], borderRadius:6 }]}, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{grid:{color:'rgba(0,0,0,.04)'}}, x:{grid:{display:false}} } } });
  }
  private buildClientsChart(): void {
    const ctx = document.getElementById('clientsChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'line', data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar'], datasets:[{ label:'New Clients', data:[124,198,287,342,401,284], borderColor:'#8B5CF6', backgroundColor:'rgba(139,92,246,.07)', tension:.4, fill:true }]}, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{grid:{color:'rgba(0,0,0,.04)'}}, x:{grid:{display:false}} } } });
  }
}
