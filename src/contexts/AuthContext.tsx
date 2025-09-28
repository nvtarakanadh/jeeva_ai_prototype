import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Patient, Doctor, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: (Patient | Doctor) & { id: string } | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (userData: Partial<Patient | Doctor>, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Patient | Doctor>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(Patient | Doctor) & { id: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    console.log('🔧 AuthContext: useEffect started');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔧 AuthContext: Initial session', { session, error });
        
        if (session?.user) {
          setSession(session);
          
          // Load user profile from database
          const loadUserProfile = async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (error) {
                console.error('Error loading profile:', error);
                // Fallback to session metadata
                const userData = {
                  id: session.user.id,
                  name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email || '',
                  phone: '',
                  role: (session.user.user_metadata?.role as UserRole) || 'patient',
                  dateOfBirth: undefined,
                  gender: undefined,
                  bloodGroup: undefined,
                  allergies: [],
                  emergencyContact: undefined,
                  specialization: undefined,
                  licenseNumber: undefined,
                  hospitalAffiliation: undefined,
                  createdAt: new Date(session.user.created_at),
                  updatedAt: new Date(session.user.updated_at),
                } as any;
                setUser(userData);
              } else {
                // Use profile data from database
                const userData = {
                  id: profile.user_id,
                  name: profile.full_name,
                  email: profile.email,
                  phone: profile.phone || '',
                  role: profile.role as UserRole,
                  dateOfBirth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
                  gender: profile.gender,
                  bloodGroup: profile.blood_group,
                  allergies: profile.allergies || [],
                  emergencyContact: profile.emergency_contact_name ? {
                    name: profile.emergency_contact_name,
                    phone: profile.emergency_contact_phone,
                    relationship: profile.emergency_contact_relationship
                  } : undefined,
                  specialization: profile.specialization,
                  licenseNumber: profile.license_number,
                  hospitalAffiliation: profile.hospital_affiliation,
                  createdAt: new Date(profile.created_at),
                  updatedAt: new Date(profile.updated_at),
                } as any;
                console.log('🔧 AuthContext: Setting user data from profile', userData);
                setUser(userData);
              }
            } catch (error) {
              console.error('Error in loadUserProfile:', error);
              setUser(null);
            }
          };
          
          loadUserProfile();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('🔧 AuthContext: Error getting initial session', error);
        setUser(null);
      } finally {
        console.log('🔧 AuthContext: Setting initial loading to false');
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔧 AuthContext: onAuthStateChange triggered', { event, hasSession: !!session, hasUser: !!session?.user });
        
        setSession(session);
        if (session?.user) {
          // Create basic user data from session metadata
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            phone: '',
            role: (session.user.user_metadata?.role as UserRole) || 'patient',
            dateOfBirth: undefined,
            gender: undefined,
            bloodGroup: undefined,
            allergies: [],
            emergencyContact: undefined,
            specialization: undefined,
            licenseNumber: undefined,
            hospitalAffiliation: undefined,
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date(session.user.updated_at),
          } as any;
          
          console.log('🔧 AuthContext: Setting user data during auth change', userData);
          setUser(userData);
          
          // Force a re-render by updating loading state
          console.log('🔧 AuthContext: User data set, triggering re-render');
        } else {
          console.log('🔧 AuthContext: No session/user, setting user to null');
          setUser(null);
        }
      }
    );

    return () => {
      console.log('🔧 AuthContext: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      console.log('🔧 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔧 Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('🔧 User logged in:', data.user.id);
        
        // Load user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          // Create a basic profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email,
              role: data.user.user_metadata?.role || 'patient'
            });
          
          if (insertError) {
            console.error('Profile creation error:', insertError);
          }
        } else {
          console.log('🔧 Profile loaded:', profile);
        }
      }

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });

      // The auth state change listener will handle setting the user data
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: any, password: string) => {
    console.log('🔧 AuthContext: Register started');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email!,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.name,
            role: userData.role || 'patient',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userData.name,
            phone: userData.phone,
            role: userData.role || 'patient',
            date_of_birth: userData.dateOfBirth,
            gender: userData.gender,
            blood_group: userData.bloodGroup,
            allergies: userData.allergies,
            emergency_contact_name: userData.emergencyContact?.name,
            emergency_contact_phone: userData.emergencyContact?.phone,
            emergency_contact_relationship: userData.emergencyContact?.relationship,
            specialization: userData.specialization,
            license_number: userData.licenseNumber,
            hospital_affiliation: userData.hospitalAffiliation,
          })
          .eq('user_id', data.user.id);

        if (profileError) console.error('Profile update error:', profileError);
      }

      console.log('🔧 AuthContext: Registration successful');
      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      console.error('🔧 AuthContext: Registration failed', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user || !session) return;

    console.log('🔧 AuthContext: Update profile started');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          phone: updates.phone,
          date_of_birth: updates.dateOfBirth,
          gender: updates.gender,
          blood_group: updates.bloodGroup,
          allergies: updates.allergies,
          emergency_contact_name: updates.emergencyContact?.name,
          emergency_contact_phone: updates.emergencyContact?.phone,
          emergency_contact_relationship: updates.emergencyContact?.relationship,
          specialization: updates.specialization,
          license_number: updates.licenseNumber,
          hospital_affiliation: updates.hospitalAffiliation,
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      console.log('🔧 AuthContext: Profile updated successfully');
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('🔧 AuthContext: Profile update failed', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};