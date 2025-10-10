import { User } from '../types';
import { MOCK_USERS } from '../constants';

const USER_SESSION_KEY = 'siakad_user_session';

export const authService = {
  async login(username: string): Promise<User> {
    // In a real app, you'd call an API. Here we simulate it.
    // We don't check the password for this mock.
    const user = MOCK_USERS.find(u => u.username === username);

    if (!user) {
      // Delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('Username tidak ditemukan.');
    }

    // Simulate session storage
    try {
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
        console.error("Could not set session storage", e);
    }
    
    return user;
  },

  async logout(): Promise<void> {
    try {
        sessionStorage.removeItem(USER_SESSION_KEY);
    } catch (e) {
        console.error("Could not remove from session storage", e);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
        const userJson = sessionStorage.getItem(USER_SESSION_KEY);
        if (userJson) {
            return JSON.parse(userJson) as User;
        }
    } catch (e) {
        console.error("Could not get from session storage", e);
        return null;
    }
    return null;
  },
};
