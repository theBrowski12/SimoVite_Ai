import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { ConfigService, EmailConfig, PricingConfig, ServiceHealth } from '@services/config.service';
import { NotificationService } from '@services/notification.service';

@Component({
  selector:    'app-config',
  standalone:  false,
  templateUrl: './config.html',
  styleUrls:   ['./config.scss']
})
export class Config implements OnInit, OnDestroy {

  // ── State ────────────────────────────────────────────────
  loadingPricing  = true;
  loadingHealth   = true;
  savingPricing   = false;
  loadingEmail = true;
  // ── Pricing ──────────────────────────────────────────────
  pricing: PricingConfig = {
    baseCost:      10,
    perKm:         2,
    rushSurcharge: 5,
    nightDiscount: 2
  };
  pricingDirty = false;   // true dès que l'user modifie un champ

  // ── Health ───────────────────────────────────────────────
  services: ServiceHealth[] = [];
  lastRefreshed = '';
  private healthPoll$?: Subscription;
  POLL_INTERVAL_MS = 30_000;   // refresh toutes les 30s


  // ── Static config (non editable côté Angular) ────────────
  kafkaTopics = [
    { name: 'order-topics',    partitions: 3, status: 'ACTIVE' },
    { name: 'delivery-topics', partitions: 3, status: 'ACTIVE' },
  ];
  /*email = {
    host:   'smtp.gmail.com',
    port:   '587',
    sender: 'simo.bambou@gmail.com',
  };*/
  email: EmailConfig = { host: '', port: '', sender: '' };
  constructor(
    private configSvc: ConfigService,
    private notif:     NotificationService,
    private cdr:       ChangeDetectorRef // <-- Injection ici
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadPricing();
    this.startHealthPolling();
    this.loadEmailConfig();
  }

  ngOnDestroy(): void {
    this.healthPoll$?.unsubscribe();
  }

  // ── Pricing ───────────────────────────────────────────────

loadPricing(): void {
    this.loadingPricing = true;
    this.configSvc.getPricing().subscribe({
      next:  p  => { 
        this.pricing = p; 
        this.loadingPricing = false; 
        this.pricingDirty = false; 
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      },
      error: () => { 
        this.loadingPricing = false; 
        this.notif.error('Failed to load pricing config.'); 
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      }
    });
  }

  onPricingChange(): void {
    this.pricingDirty = true;
  }

savePricing(): void {
    if (!this.pricingDirty) return;
    this.savingPricing = true;
    this.configSvc.savePricing(this.pricing).subscribe({
      next:  () => { 
        this.savingPricing = false; 
        this.pricingDirty = false; 
        this.notif.success('Pricing rules saved ✓'); 
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      },
      error: () => { 
        this.savingPricing = false; 
        this.notif.error('Failed to save. Try again.'); 
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      }
    });
  }

  cancelPricing(): void {
    this.loadPricing();    // recharge depuis le serveur = annule les modifs
  }

  // ── Health polling ────────────────────────────────────────

startHealthPolling(): void {
    this.healthPoll$ = interval(this.POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.configSvc.getServicesHealth().pipe(
        catchError(err => {
          console.error('Erreur de récupération de la santé des services:', err);
          return of([]);
        })
      ))
    ).subscribe({
      next: services => {
        if (services && services.length > 0) {
          this.services = services;
        }
        this.loadingHealth = false;
        this.lastRefreshed = new Date().toLocaleTimeString('fr-MA');
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      }
    });
  }

  refreshHealth(): void {
    this.loadingHealth = true;
    this.configSvc.getServicesHealth().subscribe({
      next: s  => { 
        this.services = s; 
        this.loadingHealth = false; 
        this.lastRefreshed = new Date().toLocaleTimeString('fr-MA'); 
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      },
      error: () => { 
        this.loadingHealth = false; 
        this.cdr.detectChanges(); // <-- Force la mise à jour UI
      }
    });
  }

  loadEmailConfig(): void {
    this.loadingEmail = true;
    this.configSvc.getEmailConfig().subscribe({
      next: (config) => {
        this.email = config;
        this.loadingEmail = false;
        this.cdr.detectChanges(); // <-- On force la maj UI
      },
      error: (err) => {
        console.error('Erreur chargement config email:', err);
        this.loadingEmail = false;
        this.notif.error('Failed to load Email config.');
        this.cdr.detectChanges(); // <-- On force la maj UI
      }
    });
  }
  // ── Computed ──────────────────────────────────────────────

  get servicesUp():   number { return this.services.filter(s => s.status === 'UP').length; }
  get servicesDown(): number { return this.services.filter(s => s.status === 'DOWN').length; }
}