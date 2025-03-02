/**
 * Notification Service Interface
 * Defines the contract for notification services.
 */

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  duration?: number;
}

export type NotificationHandler = (notification: Notification) => void;

export interface INotificationService {
  /**
   * Shows a notification
   * @param message The notification message
   * @param type The notification type
   * @param duration Optional duration in milliseconds
   */
  notify(message: string, type: NotificationType, duration?: number): void;
  
  /**
   * Shows a success notification
   * @param message The notification message
   * @param duration Optional duration in milliseconds
   */
  success(message: string, duration?: number): void;
  
  /**
   * Shows an error notification
   * @param message The notification message
   * @param duration Optional duration in milliseconds
   */
  error(message: string, duration?: number): void;
  
  /**
   * Shows a warning notification
   * @param message The notification message
   * @param duration Optional duration in milliseconds
   */
  warning(message: string, duration?: number): void;
  
  /**
   * Shows an info notification
   * @param message The notification message
   * @param duration Optional duration in milliseconds
   */
  info(message: string, duration?: number): void;
  
  /**
   * Registers a handler for notifications
   * @param handler Function to call when a notification is shown
   * @returns Function to unregister the handler
   */
  onNotification(handler: NotificationHandler): () => void;
}
