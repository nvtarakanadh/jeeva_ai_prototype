import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { createNotification } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NotificationDebug: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, refreshNotifications } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);

  const createTestNotification = async () => {
    if (!user?.id) {
      alert('No user ID available');
      return;
    }

    setIsCreating(true);
    try {
      // Get user's profile ID and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        alert('No profile found for user');
        return;
      }

      // Create different test notifications based on user role
      const isDoctor = profile.role === 'doctor';
      const actionUrl = isDoctor ? '/doctor/consultations' : '/consultations';
      const notificationType = isDoctor ? 'consultation_booked' : 'system';

      const notificationId = await createNotification({
        userId: user.id,
        profileId: profile.id,
        type: notificationType,
        title: isDoctor ? 'Test Consultation Booking' : 'Debug Test Notification',
        message: isDoctor 
          ? 'Test Patient has booked a consultation for tomorrow' 
          : `This is a test notification created at ${new Date().toLocaleString()}`,
        actionUrl: actionUrl
      });

      if (notificationId) {
        alert(`Test notification created with ID: ${notificationId}\nType: ${notificationType}\nAction URL: ${actionUrl}`);
        refreshNotifications();
      } else {
        alert('Failed to create test notification');
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Notification System Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>User ID:</strong> {user?.id || 'Not logged in'}
          </div>
          <div>
            <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Total Notifications:</strong> {notifications.length}
          </div>
          <div>
            <strong>Unread Count:</strong> {unreadCount}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={createTestNotification} 
            disabled={isCreating || !user?.id}
          >
            {isCreating ? 'Creating...' : 'Create Test Notification'}
          </Button>
          <Button onClick={refreshNotifications} variant="outline">
            Refresh Notifications
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Current Notifications:</h3>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">No notifications found</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 border rounded cursor-pointer hover:bg-accent transition-colors ${
                    notification.read ? 'bg-muted' : 'bg-background'
                  }`}
                  onClick={() => {
                    console.log('Debug: Notification clicked:', notification);
                    console.log('Debug: Action URL:', notification.actionUrl);
                    console.log('Debug: Type:', notification.type);
                    // You can add navigation test here if needed
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {notification.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notification.type} • {notification.createdAt.toLocaleString()}
                        {notification.read ? ' • Read' : ' • Unread'}
                        {notification.actionUrl && ` • Action: ${notification.actionUrl}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
