/**
 * Authentication and authorization abstraction
 * Prepared for Supabase Auth integration
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'buyer' | 'viewer';
}

export interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  canEdit(): boolean;
  isAdmin(): boolean;
  getAuthHeaders(): Record<string, string>;
  setTestUser(user: User | null): void;
}

class MockAuthService implements IAuthService {
  private user: User | null = {
    id: 'user-001',
    email: 'admin@chinasuppliers.io',
    name: 'Sourcing Director',
    role: 'admin',
  };

  async getCurrentUser(): Promise<User | null> {
    return this.user;
  }

  canEdit(): boolean {
    return this.user?.role === 'admin' || this.user?.role === 'buyer';
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.user) {
      return {};
    }
    return {
      'Authorization': `Bearer token-${this.user.id}-${this.user.role}`,
      'X-User-Id': this.user.id,
      'X-User-Email': this.user.email,
      'X-User-Role': this.user.role,
    };
  }

  setTestUser(user: User | null): void {
    this.user = user;
  }
}

export const authService = new MockAuthService();
