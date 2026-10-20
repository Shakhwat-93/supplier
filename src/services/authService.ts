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
}

class MockAuthService implements IAuthService {
  private user: User = {
    id: 'user-001',
    email: 'admin@chinasuppliers.io',
    name: 'Sourcing Director',
    role: 'admin',
  };

  async getCurrentUser(): Promise<User | null> {
    return this.user;
  }

  canEdit(): boolean {
    return this.user.role === 'admin' || this.user.role === 'buyer';
  }
}

export const authService = new MockAuthService();
