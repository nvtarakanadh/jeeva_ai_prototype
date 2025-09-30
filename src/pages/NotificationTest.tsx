import React from 'react';
import { NotificationDebug } from '@/components/debug/NotificationDebug';

export const NotificationTest: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification System Test</h1>
      <NotificationDebug />
    </div>
  );
};
