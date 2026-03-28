import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({ selector: 'app-ml-insights', 
  standalone: false, 
  templateUrl: './ml-insights.html', 
  styleUrls: ['./ml-insights.scss'] })
  
export class MlInsights implements OnInit, AfterViewInit {
  etaMetrics  = { mae: 1.8, r2: 0.97, accuracy: 91, samples: 180 };
  priceMetrics= { mae: 2.3, r2: 0.95, accuracy: 88, samples: 200 };
  weatherData = [
    { label:'Clear',       factor:1.00, avgEta:22, color:'#22C55E' },
    { label:'Cloudy',      factor:0.95, avgEta:24, color:'#3B82F6' },
    { label:'Rain',        factor:0.72, avgEta:32, color:'#F59E0B' },
    { label:'Fog',         factor:0.70, avgEta:38, color:'#FF6B35' },
    { label:'Thunderstorm',factor:0.55, avgEta:55, color:'#EF4444' },
  ];
  rushData = [
    { period:'Morning rush (7–9h)',   factor:0.65 },
    { period:'Lunch (12–14h)',        factor:0.80 },
    { period:'Normal',               factor:1.00 },
    { period:'Evening rush (17–20h)', factor:0.60 },
    { period:'Night (22h–5h)',        factor:1.25 },
  ];
  vehicleData = [
    { type:'MOTORCYCLE',icon:'🛵',base:40,orders:45 },
    { type:'CAR',       icon:'🚗',base:28,orders:35 },
    { type:'BICYCLE',   icon:'🚲',base:12,orders:12 },
    { type:'TRUCK',     icon:'🚛',base:20,orders:8  },
  ];
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    setTimeout(() => { this.buildEtaChart(); this.buildVehicleChart(); this.buildWeatherChart(); }, 300);
  }
  private buildEtaChart(): void {
    const ctx = document.getElementById('etaChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'line', data:{ labels:Array.from({length:30},(_,i)=>'D'+(i+1)), datasets:[
      { label:'Predicted', data:Array.from({length:30},()=>Math.floor(18+Math.random()*12)), borderColor:'#FF6B35', tension:.4, pointRadius:2 },
      { label:'Actual',    data:Array.from({length:30},()=>Math.floor(16+Math.random()*16)), borderColor:'#3B82F6', tension:.4, pointRadius:2, borderDash:[4,3] as any }
    ]}, options:{ responsive:true, plugins:{legend:{position:'bottom'}}, scales:{ y:{grid:{color:'rgba(0,0,0,.04)'}}, x:{display:false} } } });
  }
  private buildVehicleChart(): void {
    const ctx = document.getElementById('vehicleChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'doughnut', data:{ labels:this.vehicleData.map(v=>v.type), datasets:[{ data:this.vehicleData.map(v=>v.orders), backgroundColor:['#FF6B35','#3B82F6','#8B5CF6','#F59E0B'], borderWidth:0 }]}, options:{ responsive:true, cutout:'65%', plugins:{legend:{position:'bottom'}} } });
  }
  private buildWeatherChart(): void {
    const ctx = document.getElementById('weatherChart') as HTMLCanvasElement; if (!ctx) return;
    new Chart(ctx, { type:'bar', data:{ labels:this.weatherData.map(w=>w.label), datasets:[{ label:'Avg ETA (min)', data:this.weatherData.map(w=>w.avgEta), backgroundColor:this.weatherData.map(w=>w.color), borderRadius:6 }]}, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{grid:{color:'rgba(0,0,0,.04)'}}, x:{grid:{display:false}} } } });
  }
  getRushColor(f:number):string { if(f>=1.2)return'#22C55E'; if(f>=1)return'#3B82F6'; if(f>=.75)return'#F59E0B'; return'#EF4444'; }
  gaugeArc(pct:number):string { return `${pct*1.73} 173`; }
}
