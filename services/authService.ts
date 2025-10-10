import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

/**
 * Maps a Supabase user and their profile to the application's User type.
 * @param supabaseUser - The user object from Supabase Auth.
 * @returns A promise that resolves to an application User object or null.
 */
const mapSupabaseUserToAppUser = async (supabaseUser: any): Promise<User | null> => {
  if (!supabaseUser) return null;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        school:schools ( name, level )
      `)
      .eq('id', supabaseUser.id)
      .single();

    if (error || !profile) {
      throw new Error(error?.message || 'User profile not found.');
    }
    
    return {
      id: profile.id,
      email: supabaseUser.email,
      username: profile.username,
      name: profile.full_name,
      role: profile.role as UserRole,
      avatarUrl: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`,
      schoolId: profile.school_id || undefined,
      schoolName: (profile.school as any)?.name || undefined,
      level: (profile.school as any)?.level || undefined,
    };
  } catch(e) {
      console.error("Failed to map Supabase user:", e);
      return null;
  }
};

/**
 * Logs in a user with their identity number (NIS/NIP) and password.
 * @param identifier - The user's unique identity number (e.g., NIS for students).
 * @param password - The user's password.
 * @returns A promise that resolves to the logged-in User object.
 */
const login = async (identifier: string, password: string): Promise<User> => {
    // Step 1: Securely get the user's email from their identity number using an RPC function.
    const { data: email, error: rpcError } = await supabase.rpc('get_email_from_identity', {
      identity_number_input: identifier
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error("Terjadi kesalahan saat mencari pengguna.");
    }

    if (!email) {
      throw new Error("Nomor Induk tidak ditemukan.");
    }
    
    // Step 2: Use the retrieved email to sign in with Supabase Auth.
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        // Provide a more user-friendly message for invalid credentials
        if (error.message.includes('Invalid login credentials')) {
            throw new Error('Nomor Induk atau password salah.');
        }
        throw new Error(error.message);
    }
    
    if (!data.user) {
        throw new Error('Login gagal: tidak ada data pengguna dari Supabase.');
    }

    const appUser = await mapSupabaseUserToAppUser(data.user);

    if (!appUser) {
        // This case can happen if a user exists in auth.users but not in public.profiles
        await supabase.auth.signOut();
        throw new Error('Login berhasil, namun profil pengguna tidak dapat dimuat.');
    }

    return appUser;
};

/**
 * Logs out the current user.
 */
const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    }
};

/**
 * Retrieves the current user from the session.
 * @returns A promise that resolves to the current User object or null if not logged in.
 */
const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        return null;
    }

    if (!session?.user) {
        return null;
    }

    return await mapSupabaseUserToAppUser(session.user);
};

export const authService = {
  login,
  logout,
  getCurrentUser,
};