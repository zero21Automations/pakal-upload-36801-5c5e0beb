import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserProfile, UserRole } from '@/types/roles';
import { useAuth } from './useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          if (profileError.code !== 'PGRST116') { // Not found is OK
            console.error('Error fetching profile:', profileError);
          }
          setProfile(null);
        } else {
          setProfile(profileData as any);
        }

        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          if (roleError.code !== 'PGRST116') {
            console.error('Error fetching role:', roleError);
          }
          setRole(null);
        } else {
          setRole(roleData.role);
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return { profile, role, loading, needsOnboarding: user && !profile };
};
