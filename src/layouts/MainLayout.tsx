import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  console.log('🔧 MainLayout: Render state', { isAuthenticated, isLoading, hasUser: !!user, user: user });

  useEffect(() => {
    console.log('🔧 MainLayout: useEffect triggered', { isAuthenticated, isLoading });
    if (!isLoading && !isAuthenticated) {
      console.log('🔧 MainLayout: Redirecting to auth');
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    console.log('🔧 MainLayout: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔧 MainLayout: Not authenticated, returning null');
    return null;
  }

  console.log('🔧 MainLayout: Rendering main layout');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {console.log('🔧 MainLayout: Rendering children:', children)}
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;