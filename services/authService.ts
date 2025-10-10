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
        identityNumber: identity_number,
        full_name,
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
        identityNumber: 'N/A',
        name: supabaseUser.email || 'Pengguna',
        role: UserRole.STUDENT, // Default role
      };
    }

    // Explicitly type casting for nested 'schools' object
    const schoolData = profile.schools as { name: string } | null;

    const appUser: User = {
      id: profile.id,
      email: supabaseUser.email || '',
      identityNumber: profile.identityNumber, // Use the aliased property
      name: profile.full_name,
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
  async login(identityNumber: string, password: string):Promise<User> {
    // Step 1: Call the PostgreSQL function to get the email from the identity number
    const { data: email, error: rpcError } = await supabase.rpc('get_email_from_identity', {
      identity_number_input: identityNumber
    });

    if (rpcError || !email) {
      throw new Error('Nomor Induk tidak ditemukan atau tidak valid.');
    }
    
    // Step 2: Use the retrieved email to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error messages to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Nomor Induk atau kata sandi salah.');
      }
      throw new Error(error.message);
    }
    
    if (!data.user) {
        throw new Error('Login gagal, pengguna tidak ditemukan.');
    }

    // Step 3: Get the full user profile
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
