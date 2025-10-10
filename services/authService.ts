import { User, School } from '../types';
import { supabase } from './supabaseClient';

class AuthService {
  public async login(email: string, password_unused: string): Promise<User | null> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password_unused, // In a real app, use the actual password
    });

    if (authError || !authData.user) {
      console.error('Supabase login error:', authError?.message);
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        school:schools ( name, level )
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Supabase profile fetch error:', profileError?.message);
      await this.logout(); // Logout if profile is not found
      return null;
    }

    const user: User = {
      id: profileData.id,
      email: authData.user.email || '',
      username: profileData.username,
      name: profileData.full_name,
      role: profileData.role,
      avatarUrl: profileData.avatar_url || `https://i.pravatar.cc/150?u=${profileData.id}`,
      schoolId: profileData.school_id,
      schoolName: profileData.school?.name,
      level: profileData.school?.level,
    };
    
    return user;
  }

  public async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  public async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        school:schools ( name, level )
      `)
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profileData) {
      return null;
    }
    
    const user: User = {
      id: profileData.id,
      email: session.user.email || '',
      username: profileData.username,
      name: profileData.full_name,
      role: profileData.role,
      avatarUrl: profileData.avatar_url || `https://i.pravatar.cc/150?u=${profileData.id}`,
      schoolId: profileData.school_id,
      schoolName: profileData.school?.name,
      level: profileData.school?.level,
    };

    return user;
  }
}

export const authService = new AuthService();