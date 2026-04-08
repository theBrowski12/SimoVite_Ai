import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KeycloakService } from '@core/auth/keycloak.service';
import { AuthService } from '@core/auth/auth.service';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-admin-account',
  standalone: false,
  templateUrl: './admin-account.html',
  styleUrls: ['./admin-account.scss']
})
export class AdminAccount implements OnInit {
  profile: any = {};
  tokenData: any = {};
  roles: string[] = [];
  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  editingProfile = false;
  editingPassword = false;

  constructor(
    private keycloak: KeycloakService,
    private auth: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  async loadUserProfile(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const profile = await this.keycloak.loadUserProfile();
      this.profile = profile;
      this.tokenData = this.keycloak.getDecodedToken();
      this.roles = this.keycloak.getRoles();

      this.profileForm.patchValue({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        username: profile.username || ''
      });

      this.loading = false;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load profile:', err);
      this.errorMessage = 'Failed to load your profile.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  startEditProfile(): void {
    this.editingProfile = true;
    this.profileForm.enable();
    this.profileForm.get('username')?.disable();
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
    this.profileForm.patchValue({
      firstName: this.profile.firstName || '',
      lastName: this.profile.lastName || '',
      email: this.profile.email || '',
      username: this.profile.username || ''
    });
    this.profileForm.get('username')?.disable();
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    try {
      const kc = (this.keycloak as any).keycloak as Keycloak;
      const response = await fetch(`${(kc as any).realmUrl}account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.keycloak.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: this.profileForm.get('firstName')?.value,
          lastName: this.profileForm.get('lastName')?.value,
          email: this.profileForm.get('email')?.value
        })
      });

      if (response.ok || response.status === 204) {
        this.successMessage = 'Profile updated successfully!';
        this.editingProfile = false;
        await this.loadUserProfile();
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.errorMessage = errorData.error || 'Failed to update profile.';
      }

      this.saving = false;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Profile update failed:', err);
      this.errorMessage = 'Failed to update profile.';
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  startEditPassword(): void {
    this.editingPassword = true;
    this.passwordForm.reset();
  }

  cancelEditPassword(): void {
    this.editingPassword = false;
    this.passwordForm.reset();
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    try {
      const kc = (this.keycloak as any).keycloak as Keycloak;
      const response = await fetch(`${(kc as any).realmUrl}account/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.keycloak.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current: this.passwordForm.get('currentPassword')?.value,
          new: this.passwordForm.get('newPassword')?.value
        })
      });

      if (response.ok || response.status === 204) {
        this.successMessage = 'Password changed successfully!';
        this.editingPassword = false;
        this.passwordForm.reset();
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.errorMessage = errorData.error || 'Failed to change password. Check your current password.';
      }

      this.saving = false;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Password change failed:', err);
      this.errorMessage = 'Failed to change password.';
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getRoleBadgeClass(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'badge-purple',
      STORE_OWNER: 'badge-orange',
      CLIENT: 'badge-blue',
      COURIER: 'badge-green'
    };
    return m[role] || 'badge-gray';
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.auth.logout();
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
