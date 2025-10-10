import { User } from '../types';
import { MOCK_USERS } from '../constants';

const USER_SESSION_KEY = 'siakad_user_session';

// This login function now correctly simulates login via NIS/NIP (as the username)
const login = async (username: string): Promise<User> => {
  console.log(`Mencoba login dengan Nomor Induk (NIS/NIP): ${username}`);
  
  // In a real app, this logic would be on a secure backend.
  // Here, we simulate finding the user by their unique username (NIS/NIP).
  const user = MOCK_USERS.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (user) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Store the found user session in local storage
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    console.log("Login berhasil, sesi pengguna disimpan:", user);
    return user;
  } else {
    console.log("Login gagal: Nomor Induk tidak ditemukan");
    throw new Error('Nomor Induk atau kata sandi salah.');
  }
};

const logout = async (): Promise<void> => {
  localStorage.removeItem(USER_SESSION_KEY);
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log("Pengguna keluar, sesi dibersihkan.");
};

const getCurrentUser = async (): Promise<User | null> => {
  const sessionData = localStorage.getItem(USER_SESSION_KEY);
  if (sessionData) {
    try {
      const user: User = JSON.parse(sessionData);
      // Optional: re-validate session with backend here in a real app
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate check
      console.log("Sesi aktif ditemukan untuk pengguna:", user);
      return user;
    // FIX: Added missing curly braces to the catch block
    } catch (error) {
      console.error("Gagal mem-parsing data sesi pengguna:", error);
      localStorage.removeItem(USER_SESSION_KEY);
      return null;
    }
  }
  console.log("Tidak ada sesi pengguna yang aktif.");
  return null;
};

export const authService = {
  login,
  logout,
  getCurrentUser,
};