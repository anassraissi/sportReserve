import React, { useEffect, useState } from 'react';
import { Bell, X, Mail, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationsAPI } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Strip HTML tags from message
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationsAPI.getAll({
        page: 1,
        limit: 10,
        unread: false,
      });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmation':
        return '✅';
      case 'booking_reminder':
        return '⏰';
      case 'booking_cancellation':
        return '❌';
      case 'payment_receipt':
        return '💳';
      case 'system_alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      booking_confirmation: 'Confirmation',
      booking_reminder: 'Rappel',
      booking_cancellation: 'Annulation',
      payment_receipt: 'Paiement',
      system_alert: 'Alerte',
      broadcast: 'Annonce',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'booking_confirmation':
        return 'bg-green-100 text-green-800';
      case 'booking_reminder':
        return 'bg-blue-100 text-blue-800';
      case 'booking_cancellation':
        return 'bg-red-100 text-red-800';
      case 'payment_receipt':
        return 'bg-purple-100 text-purple-800';
      case 'system_alert':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[420px] bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Tout marquer comme lu
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">Aucune notification</p>
                <p className="text-sm">Vous êtes à jour!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-all cursor-pointer ${
                      !notification.readAt ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => !notification.readAt && markAsRead(notification._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">
                            {getIcon(notification.type)}
                          </span>
                          <h4 className="font-semibold text-sm flex-1">
                            {stripHtml(notification.title)}
                          </h4>
                          {!notification.readAt && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                          {stripHtml(notification.message)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${getBadgeColor(notification.type)} text-xs px-2 py-0.5`}>
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.readAt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Marquer comme lu"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Supprimer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
