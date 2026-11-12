import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { notificationApi } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setNotifications([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await notificationApi.getNotifications();
      // Safeguard: Ensure we set an array and do not leak another user's notifications
      if (Array.isArray(list)) {
        setNotifications(list.filter(item => item.userId === currentUser.id));
      } else {
        setNotifications([]);
      }
      setError(null);
    } catch (err: any) {
      console.error('[NotificationContext] Failed to load notifications:', err);
      setError(err?.message || 'Failed to load notifications');
      // On failure, preserve safe state without injecting any fake notification counts
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser?.id]);

  // Sync notifications whenever user authenticates, switches persona, or logs out
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setError(null);
      setLoading(false);
    }
  }, [isAuthenticated, currentUser?.id, fetchNotifications]);

  // Periodic polling & event listeners to update badge when new notifications arrive without logout/login
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    // Poll every 5 seconds for timely notification badge updates
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    // Refresh when user returns to window/tab
    const handleFocus = () => {
      fetchNotifications();
    };

    // Custom event for immediate sync after in-app actions
    const handleCustomUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('spendwise:notifications-updated', handleCustomUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('spendwise:notifications-updated', handleCustomUpdate);
    };
  }, [isAuthenticated, currentUser?.id, fetchNotifications]);

  const markAsRead = async (id: string) => {
    // Optimistically update local state immediately so unreadCount updates with 0 lag
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await notificationApi.markRead(id);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark notification as read:', err);
      // Re-fetch to restore canonical state on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistically mark all read immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await notificationApi.markAllRead();
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all notifications as read:', err);
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
