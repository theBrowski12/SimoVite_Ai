// core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService, AppRole } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'] as AppRole;

    // ✅ Admins can access ALL views (superuser privilege)
    if (this.auth.hasRole('ADMIN')) return true;

    if (this.auth.hasRole(requiredRole)) return true;

    this.router.navigate(['/unauthorized']);
    return false;
  }
}