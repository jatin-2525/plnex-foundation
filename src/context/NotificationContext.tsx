'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './AppContext';
import { useToast } from './ToastContext';
import {
  PLnEXNotification,
  INITIAL_NOTIFICATIONS,
  NotificationType,
  getUnreadNotificationCount,
  filterNotifications,
} from '../lib/domain/notificationData';
import { ActivityDrawerTab } from '../lib/domain/activityDetailData';

interface NotificationContextType {
  notifications: PLnEXNotification[];
  filteredNotifications: PLnEXNotification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  showUnreadOnly: boolean;
  setShowUnreadOnly: (unreadOnly: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  handleNotificationClick: (notification: PLnEXNotification) => void;
  resetNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { openActivityDrawer, notificationOpen, setNotificationOpen } = useApp();
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState<PLnEXNotification[]>(INITIAL_NOTIFICATIONS);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const unreadCount = useMemo(() => getUnreadNotificationCount(notifications), [notifications]);

  const filteredNotifications = useMemo(() => {
    return filterNotifications(notifications, {
      typeFilter: selectedType,
      onlyUnread: showUnreadOnly,
      searchQuery,
    });
  }, [notifications, selectedType, showUnreadOnly, searchQuery]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast({
      type: 'info',
      title: 'All Notifications Marked as Read',
      description: 'Your project notification queue is up to date.',
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const resetNotifications = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const handleNotificationClick = (notification: PLnEXNotification) => {
    // 1. Mark as read
    markAsRead(notification.id);

    // 2. Close notification center dropdown/drawer
    setNotificationOpen(false);

    const { destination } = notification;

    // 3. If destination specifies an activity drawer target, open it immediately
    if (destination.drawerType === 'activity' && destination.targetId) {
      const targetTab = (destination.tab as ActivityDrawerTab) || 'overview';
      openActivityDrawer(destination.targetId, targetTab);
    }

    // 4. Navigate to the relevant PLnEX route
    if (destination.route) {
      router.push(destination.route);
    }

    // 5. Toast feedback indicating destination opened
    addToast({
      type: 'info',
      title: notification.title,
      description: `Opening ${destination.actionLabel}...`,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        unreadCount,
        isOpen: notificationOpen,
        setIsOpen: setNotificationOpen,
        selectedType,
        setSelectedType,
        showUnreadOnly,
        setShowUnreadOnly,
        searchQuery,
        setSearchQuery,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        dismissNotification,
        handleNotificationClick,
        resetNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
