// Using Vitest global APIs (describe/it/vi/expect are available globally when running tests)
// Mock supabase client module used by authService
vi.mock('../services/supabaseClient', () => {
  return {
    supabase: {
      rpc: async () => ({ data: 'user@example.com', error: null }),
      auth: {
        signInWithPassword: async () => ({ data: { user: { id: 'uid1', email: 'user@example.com' } }, error: null }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: 'uid1', full_name: 'User', role: 'Siswa' }, error: null })
          })
        })
      })
    }
  };
});

import { authService } from '../services/authService';

describe('authService.login', () => {
  it('should login with identity number and password', async () => {
    const user = await authService.login('12345', 'password');
    expect(user).toBeDefined();
    expect(user.email).toBe('user@example.com');
  });
});
