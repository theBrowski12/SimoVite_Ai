import { Component } from '@angular/core';
interface ServiceStatus { name:string; port:string; status:'UP'|'DOWN'; }

@Component({ selector:'app-config', 
  standalone:false, 
  templateUrl:'./config.html', 
  styleUrls:['./config.scss'] })
  
export class Config {
  services:ServiceStatus[]=[
    {name:'Discovery_Service',   port:'8761', status:'UP'},
    {name:'Gateway_Service',     port:'8888', status:'UP'},
    {name:'Catalog_Service',     port:'8081', status:'UP'},
    {name:'Order_Service',       port:'8082', status:'UP'},
    {name:'Delivery_Service',    port:'8083', status:'UP'},
    {name:'ETA_Service',         port:'8085', status:'UP'},
    {name:'Notification_Service',port:'8089', status:'UP'},
    {name:'ChatBot_Service',     port:'8084', status:'DOWN'},
  ];
  pricing = { baseCost:'10.00', perKm:'2.00', rushSurcharge:'5.00', nightDiscount:'2.00' };
  kafkaTopics = ['order-topics','delivery-topics'];
  email = { host:'smtp.gmail.com', port:'587', sender:'simo.bambou@gmail.com', status:'Connected' };
  save():void { alert('Settings saved! (Connect to backend in production)'); }
}
