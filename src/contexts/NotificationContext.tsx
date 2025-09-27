import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mock notifications for now since we don't have a notifications table
  useEffect(() => {
    if (user) {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          userId: user.id,
          title: 'AI Analysis Complete',
          message: 'Your blood test analysis is ready to view',
          type: 'ai_analysis',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          actionUrl: '/ai-insights',
        },
        {
          id: '2',
          userId: user.id,
          title: 'Consent Request',
          message: 'Dr. Wilson has requested access to your medical records',
          type: 'consent_request',
          read: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          actionUrl: '/consent-management',
        },
        {
          id: '3',
          userId: user.id,
          title: 'New Prescription',
          message: 'You have a new prescription from Dr. Smith',
          type: 'prescription',
          read: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          actionUrl: '/health-records',
        },
        {
          id: '4',
          userId: user.id,
          title: 'Health Alert',
          message: 'High cholesterol detected in recent lab results',
          type: 'system',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          actionUrl: '/dashboard',
        },
        {
          id: '5',
          userId: user.id,
          title: 'Appointment Reminder',
          message: 'Your appointment with Dr. Johnson is tomorrow at 2 PM',
          type: 'system',
          read: false,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          actionUrl: '/dashboard',
        },
      ];
      setNotifications(mockNotifications);
    }
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const refreshNotifications = () => {
    // In a real app, this would fetch from the database
    // For now, we'll keep the mock data
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
