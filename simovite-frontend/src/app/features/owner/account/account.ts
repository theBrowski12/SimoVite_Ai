import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KeycloakService } from '@core/auth/keycloak.service';
import { AuthService } from '@core/auth/auth.service';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-account',
  standalone: false,
  templateUrl: './account.html',
  styleUrls: ['./account.scss']
})
export class Account implements OnInit {
  // User data
  profile: any = {};
  tokenData: any = {};
  roles: string[] = [];
  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  // Form
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  editingProfile = false;
  editingPassword = false;
  passwordMatch = true;

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

  // ── Form Initialization ──────────────────────────────────
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
    }, { validator: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): void {
    const pwd = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    (group as any).passwordMatchError = !(pwd && confirm && pwd === confirm);
  }

  // ── Load Profile ─────────────────────────────────────────
  async loadUserProfile(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      // Load Keycloak profile
      const profile = await this.keycloak.loadUserProfile();
      this.profile = profile;

      // Get token data
      this.tokenData = this.keycloak.getDecodedToken();
      this.roles = this.keycloak.getRoles();

      // Populate form
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

  // ── Edit Profile ─────────────────────────────────────────
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

          // Get the base URL (handles different keycloak-js versions) and remove trailing slash
          const baseUrl = (kc.authServerUrl || (kc as any).url)?.replace(/\/$/, '');
          const accountUrl = `${baseUrl}/realms/${kc.realm}/account`;

          // Update profile via Keycloak REST API
          const response = await fetch(
            accountUrl,
            {
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
            }
          );

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

  // ── Edit Password ────────────────────────────────────────
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

      // Get the base URL and build the correct path
      const baseUrl = (kc.authServerUrl || (kc as any).url)?.replace(/\/$/, '');
      const passwordUrl = `${baseUrl}/realms/${kc.realm}/account/password`;

      // Update password via Keycloak REST API
      const response = await fetch(
        passwordUrl,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.keycloak.getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            current: this.passwordForm.get('currentPassword')?.value,
            new: this.passwordForm.get('newPassword')?.value
          })
        }
      );

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

  // ── Helpers ──────────────────────────────────────────────
  formatDate(timestamp: number): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleBadgeClass(role: string): string {
    const m: Record<string, string> = {
      STORE_OWNER: 'badge-orange',
      CLIENT: 'badge-blue',
      COURIER: 'badge-green',
      ADMIN: 'badge-purple'
    };
    return m[role] || 'badge-gray';
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}

