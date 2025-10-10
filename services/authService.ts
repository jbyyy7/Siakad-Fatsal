import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';

// Helper function to fetch user profile and map to app's User type
const getAppUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        name,
        role,
        avatar_url,
        school_id,
        schools (
          name
        )
      `)
      .eq('id', supabaseUser.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error?.message);
      // Even if profile fetch fails, we know who is logged in.
      // Return a basic user object to prevent total failure.
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: 'N/A',
        name: supabaseUser.email || 'Pengguna',
        role: UserRole.STUDENT, // Default role
      };
    }

    // Explicitly type casting for nested 'schools' object
    const schoolData = profile.schools as { name: string } | null;

    const appUser: User = {
      id: profile.id,
      email: supabaseUser.email || '',
      username: profile.username,
      name: profile.name,
      role: profile.role as UserRole, // Assuming role in DB matches UserRole enum
      avatarUrl: profile.avatar_url,
      schoolId: profile.school_id,
      schoolName: schoolData?.name,
    };

    return appUser;
  } catch (e) {
    console.error('Exception in getAppUser:', e);
    return null;
  }
};

export const authService = {
  async login(email: string, password: string):Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error messages to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email atau kata sandi salah.');
      }
      throw new Error(error.message);
    }
    
    if (!data.user) {
        throw new Error('Login gagal, pengguna tidak ditemukan.');
    }

    const appUser = await getAppUser(data.user);
    if (!appUser) {
        // Sign out if profile doesn't exist to prevent being in a broken state
        await supabase.auth.signOut();
        throw new Error('Profil pengguna tidak dapat dimuat.');
    }

    return appUser;
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error logging out:", error.message);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error("Error getting session:", error.message);
        return null;
    }

    if (session?.user) {
      return await getAppUser(session.user);
    }

    return null;
  },
};