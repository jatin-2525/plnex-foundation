'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '../../context/NotificationContext';
import {
  NotificationType,
  NotificationSeverity,
  PLnEXNotification,
} from '../../lib/domain/notificationData';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  X,
  ClipboardCheck,
  TrendingDown,
  GitBranch,
  FileText,
  Camera,
  XCircle,
  RefreshCw,
  Search,
  Check,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Mail,
  MailOpen,
  Filter,
} from 'lucide-react';
import {
  getNotificationTypeIcon,
  getNotificationIconBg,
  getSeverityBadge,
} from '../shell/NotificationCenter';

export interface NotificationCenterPanelProps {
  className?: string;
  showHeading?: boolean;
}

export function NotificationCenterPanel({
  className = '',
  showHeading = true,
}: NotificationCenterPanelProps) {
  const {
    notifications,
    filteredNotifications,
    unreadCount,
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
  } = useNotifications();

  const filterTabs = [
    { id: 'ALL', label: 'All', count: notifications.length },
    { id: 'UNREAD', label: 'Unread', count: unreadCount },
    {
      id: 'New review required',
      label: 'Review Required',
      count: notifications.filter((n) => n.type === 'New review required').length,
    },
    {
      id: 'Activity delayed',
      label: 'Delays',
      count: notifications.filter((n) => n.type === 'Activity delayed').length,
    },
    {
      id: 'Dependency impacted',
      label: 'Dependencies',
      count: notifications.filter((n) => n.type === 'Dependency impacted').length,
    },
    {
      id: 'Match conflict',
      label: 'Conflicts',
      count: notifications.filter((n) => n.type === 'Match conflict').length,
    },
    {
      id: 'DPR confirmation required',
      label: 'DPR Sign-off',
      count: notifications.filter((n) => n.type === 'DPR confirmation required').length,
    },
    {
      id: 'Evidence uploaded',
      label: 'Evidence',
      count: notifications.filter((n) => n.type === 'Evidence uploaded').length,
    },
    {
      id: 'Processing failed',
      label: 'Failed Jobs',
      count: notifications.filter((n) => n.type === 'Processing failed').length,
    },
    {
      id: 'Sync conflict',
      label: 'Sync Conflicts',
      count: notifications.filter((n) => n.type === 'Sync conflict').length,
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg overflow-hidden shadow-xs flex flex-col ${className}`}
      data-testid="plnex-notification-center-panel"
    >
      {/* 1. Header Bar */}
      {showHeading && (
        <div className="p-4 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF0E9] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center text-[#006B61] dark:text-[#72C6AD]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                  Project Notification Center
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#EAF0E9] dark:bg-[#20382C] text-[#006B61] dark:text-[#9AD5AF] border border-[#D9E2DA] dark:border-[#315442]">
                  {unreadCount} unread
                </span>
              </div>
              <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                Actionable construction alerts across reviews, delays, dependencies, and sync conflicts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-3 py-1.5 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={resetNotifications}
              className="p-2 text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md transition-colors"
              title="Reset notification feed to verified defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Controls & Search */}
      <div className="p-3 bg-[#F6F7F3] dark:bg-[#101815] border-b border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by title, description, activity ID (PIP-24-001)..."
            className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] dark:placeholder-[#859688] focus:outline-none focus:border-[#006B61] dark:focus:border-[#72C6AD]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedType('ALL');
              setShowUnreadOnly(false);
            }}
            className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
              selectedType === 'ALL' && !showUnreadOnly
                ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                : 'bg-white dark:bg-[#203129] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
              showUnreadOnly
                ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                : 'bg-white dark:bg-[#203129] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
            }`}
          >
            Unread Only ({unreadCount})
          </button>

          {filterTabs
            .filter((t) => t.id !== 'ALL' && t.id !== 'UNREAD')
            .map((tab) => {
              const isActive = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(isActive ? 'ALL' : tab.id);
                  }}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                      : 'bg-white dark:bg-[#203129] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-80 font-mono">
                    ({tab.count})
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* 3. Items List */}
      <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146] overflow-y-auto max-h-[600px]">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#EAF0E9] dark:bg-[#203129] text-[#738A80] dark:text-[#859688] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 text-[#1F6B4E] dark:text-[#9AD5AF]" />
            </div>
            <p className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
              No Notifications Found
            </p>
            <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] max-w-xs mx-auto">
              {showUnreadOnly
                ? 'All notifications have been addressed.'
                : 'No alerts match your filter criteria.'}
            </p>
            {(searchQuery || selectedType !== 'ALL' || showUnreadOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('ALL');
                  setShowUnreadOnly(false);
                }}
                className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold hover:underline mt-1 inline-block cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const severityCfg = getSeverityBadge(notification.severity);

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-[#F6F7F3] dark:hover:bg-[#203129] transition-colors cursor-pointer group relative flex items-start gap-4 ${
                  !notification.isRead ? 'bg-[#F9FAFC] dark:bg-[#17221D]' : 'bg-white dark:bg-[#101815]'
                }`}
              >
                {!notification.isRead && (
                  <span
                    className="absolute left-1 top-4 bottom-4 w-1 bg-[#006B61] dark:bg-[#72C6AD] rounded-r"
                    title="Unread"
                  />
                )}

                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getNotificationIconBg(
                    notification.type
                  )}`}
                >
                  {getNotificationTypeIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A2B25] dark:text-[#F2F4E9]">
                        {notification.type}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase font-mono ${severityCfg.className}`}
                      >
                        {severityCfg.label}
                      </span>
                      {notification.sourceEntity && (
                        <span className="text-[10px] font-mono text-[#52665D] dark:text-[#B5C1B5] bg-[#EAF0E9] dark:bg-[#203129] px-1.5 py-0.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                          {notification.sourceEntity.id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#738A80] dark:text-[#859688]">
                      <Clock className="w-3 h-3" />
                      <span>{notification.relativeTime}</span>
                    </div>
                  </div>

                  <h4
                    className={`text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-snug ${
                      !notification.isRead ? 'font-bold' : 'font-semibold'
                    }`}
                  >
                    {notification.title}
                  </h4>

                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
                    {notification.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006B61] dark:text-[#72C6AD] group-hover:underline">
                      <span>{notification.destination.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>

                    <div
                      className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (notification.isRead) {
                            markAsUnread(notification.id);
                          } else {
                            markAsRead(notification.id);
                          }
                        }}
                        className="p-1 text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded transition-colors"
                        title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {notification.isRead ? (
                          <Mail className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#1F6B4E] dark:text-[#9AD5AF]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissNotification(notification.id)}
                        className="p-1 text-[#738A80] dark:text-[#859688] hover:text-[#A43B36] dark:hover:text-[#FF9E94] hover:bg-[#F6E4E1] dark:hover:bg-[#3B2422] rounded transition-colors"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationCenterPanel;
