/**
 * Notification Context
 * Provides notification functionality.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  INotificationService, 
  Notification, 
  NotificationType 
} from '../../services/interfaces/INotificationService';

interface NotificationContextType {
  notifications: Notification[];
  notify: (message: string, type: NotificationType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  clearNotifications: () => void;
}

// Create context with a default value
const NotificationContext = createContext<NotificationContextType | null>(null);

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  notificationService: INotificationService;
  children: React.ReactNode;
}

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  notificationService, 
  children 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Keep track of notifications
  useEffect(() => {
    const unsubscribe = notificationService.onNotification((notification) => {
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove notification after its duration
      if (notification.duration) {
        setTimeout(() => {
          setNotifications(prev => 
            prev.filter(n => n.id !== notification.id)
          );
        }, notification.duration);
      }
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [notificationService]);

  // Show a notification
  const notify = useCallback((
    message: string, 
    type: NotificationType, 
    duration?: number
  ) => {
    notificationService.notify(message, type, duration);
  }, [notificationService]);

  // Show a success notification
  const success = useCallback((message: string, duration?: number) => {
    notificationService.success(message, duration);
  }, [notificationService]);

  // Show an error notification
  const error = useCallback((message: string, duration?: number) => {
    notificationService.error(message, duration);
  }, [notificationService]);

  // Show a warning notification
  const warning = useCallback((message: string, duration?: number) => {
    notificationService.warning(message, duration);
  }, [notificationService]);

  // Show an info notification
  const info = useCallback((message: string, duration?: number) => {
    notificationService.info(message, duration);
  }, [notificationService]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Create value object
  const value: NotificationContextType = {
    notifications,
    notify,
    success,
    error,
    warning,
    info,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
