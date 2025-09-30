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
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('🔧 AuthContext: Loading timeout reached, setting loading to false');
      setIsLoading(false);
    }, 5000); // 5 second timeout
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔧 AuthContext: Initial session', { session, error });
        
        if (session?.user) {
          setSession(session);
          
        // Create basic user data from session metadata
        const role = (session.user.user_metadata?.role as UserRole) || 'patient';
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          phone: '',
          role,
          dateOfBirth: undefined,
          gender: undefined,
          bloodGroup: undefined,
          allergies: [],
          emergencyContact: undefined,
          ...(role === 'doctor' ? {
            specialization: 'General Medicine',
            licenseNumber: undefined,
            hospitalAffiliation: 'General Hospital',
            verified: false
          } : {}),
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(session.user.updated_at),
        } as (Patient | Doctor) & { id: string };
          
          console.log('🔧 AuthContext: Setting user data', userData);
          setUser(userData);
        } else {
          console.log('🔧 AuthContext: No session, setting user to null');
          setUser(null);
        }
      } catch (error) {
        console.error('🔧 AuthContext: Error getting initial session', error);
        setUser(null);
      } finally {
        console.log('🔧 AuthContext: Setting initial loading to false');
        clearTimeout(loadingTimeout);
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
        const role = (session.user.user_metadata?.role as UserRole) || 'patient';
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          phone: '',
          role,
          dateOfBirth: undefined,
          gender: undefined,
          bloodGroup: undefined,
          allergies: [],
          emergencyContact: undefined,
          ...(role === 'doctor' ? {
            specialization: 'General Medicine',
            licenseNumber: undefined,
            hospitalAffiliation: 'General Hospital',
            verified: false
          } : {}),
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(session.user.updated_at),
        } as (Patient | Doctor) & { id: string };
          
          console.log('🔧 AuthContext: Setting user data during auth change', userData);
          setUser(userData);
        } else {
          console.log('🔧 AuthContext: No session/user, setting user to null');
          setUser(null);
        }
        
        // Always set loading to false after processing auth state change
        console.log('🔧 AuthContext: Setting loading to false after auth state change');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🔧 AuthContext: Cleaning up subscription');
      clearTimeout(loadingTimeout);
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
        console.log('🔧 Login successful, user:', data.user);
        
        // Create basic user data from session metadata
        const role = (data.user.user_metadata?.role as UserRole) || 'patient';
        const userData = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || '',
          phone: '',
          role,
          dateOfBirth: undefined,
          gender: undefined,
          bloodGroup: undefined,
          allergies: [],
          emergencyContact: undefined,
          ...(role === 'doctor' ? {
            specialization: 'General Medicine',
            licenseNumber: undefined,
            hospitalAffiliation: 'General Hospital',
            verified: false
          } : {}),
          createdAt: new Date(data.user.created_at),
          updatedAt: new Date(data.user.updated_at),
        } as (Patient | Doctor) & { id: string };
        
        console.log('🔧 AuthContext: Setting user data during login', userData);
        setUser(userData);
      }

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });

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
        console.log('🔧 Registration successful, user:', data.user);
        
        // Create basic user data from session metadata
        const newUserData = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || '',
          phone: '',
          role: (data.user.user_metadata?.role as UserRole) || 'patient',
          dateOfBirth: undefined,
          gender: undefined,
          bloodGroup: undefined,
          allergies: [],
          emergencyContact: undefined,
          specialization: data.user.user_metadata?.role === 'doctor' ? 'General Medicine' : undefined,
          licenseNumber: undefined,
          hospitalAffiliation: data.user.user_metadata?.role === 'doctor' ? 'General Hospital' : undefined,
          createdAt: new Date(data.user.created_at),
          updatedAt: new Date(data.user.updated_at),
        } as any;
        
        console.log('🔧 AuthContext: Setting user data during registration', newUserData);
        setUser(newUserData);
      }

      console.log('🔧 AuthContext: Registration successful');

      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      });

    } catch (error: any) {
      console.error('Registration failed:', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('🔧 AuthContext: Logout called');
    supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate('/auth');
  };

  const updateProfile = async (updates: Partial<Patient | Doctor>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates } as (Patient | Doctor) & { id: string };
      setUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };

  console.log('🔧 AuthContext: Rendering with value', { isLoading, isAuthenticated: !!user, hasUser: !!user });

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