/**
 * Notification List Component
 * Displays a list of notifications.
 */
import React from 'react';
import { useNotification } from '../contexts/services/NotificationContext';
import { NotificationType } from '../services/interfaces/INotificationService';

const NotificationList: React.FC = () => {
  const { notifications, clearNotifications } = useNotification();
  
  // If no notifications, don't render anything
  if (notifications.length === 0) {
    return null;
  }

  // Get background color based on notification type
  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return '#dcfce7'; // Light green
      case NotificationType.ERROR:
        return '#fee2e2'; // Light red
      case NotificationType.WARNING:
        return '#ffedd5'; // Light orange
      case NotificationType.INFO:
      default:
        return '#e0f2fe'; // Light blue
    }
  };

  // Get border color based on notification type
  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return '#22c55e'; // Green
      case NotificationType.ERROR:
        return '#ef4444'; // Red
      case NotificationType.WARNING:
        return '#f97316'; // Orange
      case NotificationType.INFO:
      default:
        return '#3b82f6'; // Blue
    }
  };

  return (
    <div className="notification-list" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Clear all button */}
      {notifications.length > 1 && (
        <button
          onClick={clearNotifications}
          style={{
            alignSelf: 'flex-end',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            border: 'none',
            background: '#6b7280',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Clear All
        </button>
      )}

      {/* Notification items */}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            padding: '12px',
            borderRadius: '4px',
            background: getBackgroundColor(notification.type),
            borderLeft: `4px solid ${getBorderColor(notification.type)}`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: '14px' }}>
            {notification.message}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
