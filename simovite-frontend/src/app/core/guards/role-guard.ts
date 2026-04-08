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

    // ✅ Allow if user has the required role
    if (this.auth.hasRole(requiredRole)) return true;

    // ✅ Also allow COURIER to access courier routes, OWNER to access owner routes
    const url = route.pathFromRoot.map(r => r.url.map(s => s.path).join('/')).join('/');
    if (url.startsWith('courier') && this.auth.hasRole('COURIER')) return true;
    if (url.startsWith('owner') && this.auth.hasRole('STORE_OWNER')) return true;

    this.router.navigate(['/unauthorized']);
    return false;
  }
}