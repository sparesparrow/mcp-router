/**
 * Notification Service Implementation
 * Manages application notifications.
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  INotificationService, 
  Notification, 
  NotificationType,
  NotificationHandler 
} from '../interfaces/INotificationService';

export class NotificationService implements INotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<NotificationHandler> = new Set();
  private defaultDuration: number = 5000; // 5 seconds

  /**
   * Shows a notification
   */
  notify(message: string, type: NotificationType, duration?: number): void {
    const notification: Notification = {
      id: uuidv4(),
      message,
      type,
      timestamp: Date.now(),
      duration: duration || this.defaultDuration
    };

    this.notifications.push(notification);
    
    // Limit the number of stored notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }
    
    // Notify all listeners
    this.notifyListeners(notification);
  }

  /**
   * Shows a success notification
   */
  success(message: string, duration?: number): void {
    this.notify(message, NotificationType.SUCCESS, duration);
  }

  /**
   * Shows an error notification
   */
  error(message: string, duration?: number): void {
    this.notify(message, NotificationType.ERROR, duration);
  }

  /**
   * Shows a warning notification
   */
  warning(message: string, duration?: number): void {
    this.notify(message, NotificationType.WARNING, duration);
  }

  /**
   * Shows an info notification
   */
  info(message: string, duration?: number): void {
    this.notify(message, NotificationType.INFO, duration);
  }

  /**
   * Registers a handler for notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.listeners.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(handler);
    };
  }

  /**
   * Gets all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Clears all notifications
   */
  clearNotifications(): void {
    this.notifications = [];
  }

  /**
   * Notifies all listeners of a new notification
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
}
