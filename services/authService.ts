import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';

// Helper function to map database role string (e.g., 'murid') to the app's UserRole enum (e.g., 'Siswa')
const toUserRoleEnum = (dbRole: any): UserRole => {
    const roleString = String(dbRole || '').toLowerCase();
    
    // Handle legacy role names from the database for backward compatibility.
    if (roleString === 'murid') {
        return UserRole.STUDENT; // Maps 'murid' to 'Siswa'
    }
    if (roleString === 'ketua yayasan') {
        return UserRole.FOUNDATION_HEAD; // Maps 'ketua yayasan' to 'Kepala Yayasan'
    }

    // Handle current role names.
    const roleEntry = Object.entries(UserRole).find(
        ([, value]) => value.toLowerCase() === roleString
    );
    
    // If an entry is found, return the enum value.
    // Otherwise, fallback to the original dbRole.
    return roleEntry ? roleEntry[1] : dbRole as UserRole;
};


// Helper function to fetch user profile and map to app's User type
const getAppUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        identity_number,
        full_name,
        role,
        avatar_url,
        school_id,
        place_of_birth,
        date_of_birth,
        gender,
        religion,
        address,
        phone_number,
        parent_name,
        parent_phone_number
      `)
      .eq('id', supabaseUser.id)
      .single();

    if (error || !profile) {
      // CRITICAL FIX: Do not default to a 'Student'. If the profile cannot be loaded
      // after a successful authentication, it's a critical error. Abort the login.
      console.error('Error fetching user profile after login:', error?.message);
      throw new Error('Autentikasi berhasil, tetapi profil pengguna tidak dapat dimuat. Hubungi administrator.');
    }
    
    let schoolName: string | undefined = undefined;
    if (profile.school_id) {
        const { data: school } = await supabase
            .from('schools')
            .select('name')
            .eq('id', profile.school_id)
            .single();
        schoolName = school?.name;
    }


    const appUser: User = {
      id: profile.id,
      email: supabaseUser.email || '',
      identityNumber: profile.identity_number,
      name: profile.full_name,
      role: toUserRoleEnum(profile.role), // Use mapping function for safety
      avatarUrl: profile.avatar_url,
      schoolId: profile.school_id,
      schoolName: schoolName,
      placeOfBirth: profile.place_of_birth,
      dateOfBirth: profile.date_of_birth,
      gender: profile.gender,
      religion: profile.religion,
      address: profile.address,
      phoneNumber: profile.phone_number,
      parentName: profile.parent_name,
      parentPhoneNumber: profile.parent_phone_number,
    };

    return appUser;
  } catch (e: any) {
    console.error('Exception in getAppUser:', e);
    // Re-throw the error to be caught by the calling login function
    throw e;
  }
};

export const authService = {
  async login(identityNumber: string, password: string):Promise<User> {
    // Step 1: Call the PostgreSQL function to get the email from the identity number
    const { data: email, error: rpcError } = await supabase.rpc('get_email_from_identity', {
      identity_number_input: identityNumber
    });

    // Enhanced Error Handling
    if (rpcError) {
      console.error('Supabase RPC Error:', rpcError);
      if (rpcError.code === '42501' || rpcError.message.includes('permission denied')) {
        throw new Error('Gagal mengakses database karena masalah izin. Pastikan fungsi get_email_from_identity telah diberi izin EXECUTE untuk peran "anon" di SQL Editor Supabase.');
      }
      throw new Error(`Terjadi kesalahan saat validasi Nomor Induk: ${rpcError.message}`);
    }

    if (!email) {
      throw new Error('Nomor Induk tidak ditemukan di dalam sistem. Pastikan Nomor Induk yang Anda masukkan sudah benar.');
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

    // Step 3: Get the full user profile. This will now throw an error if it fails.
    const appUser = await getAppUser(data.user);
    if (!appUser) {
        // This case is less likely now, but as a safeguard, sign out.
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
      try {
        return await getAppUser(session.user);
      } catch (e) {
        // If profile fetch fails on session check, treat as logged out.
        console.error("Session valid but could not fetch profile, logging out.", e)
        await this.logout();
        return null;
      }
    }

    return null;
  },
  
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        console.error("Error updating password:", error);
        throw new Error(`Gagal memperbarui kata sandi: ${error.message}`);
    }
  }
};