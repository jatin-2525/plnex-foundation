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
  Sparkles,
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

function getNotificationTypeIcon(type: NotificationType) {
  switch (type) {
    case 'New review required':
      return <Sparkles className="w-4 h-4 text-[#D98B32]" />;
    case 'Activity delayed':
      return <TrendingDown className="w-4 h-4 text-[#B5473C]" />;
    case 'Dependency impacted':
      return <GitBranch className="w-4 h-4 text-[#7C3AED]" />;
    case 'Match conflict':
      return <AlertTriangle className="w-4 h-4 text-[#D98B32]" />;
    case 'DPR confirmation required':
      return <FileText className="w-4 h-4 text-[#176B87]" />;
    case 'Evidence uploaded':
      return <Camera className="w-4 h-4 text-[#2E7D5B]" />;
    case 'Processing failed':
      return <XCircle className="w-4 h-4 text-[#B5473C]" />;
    case 'Sync conflict':
      return <RefreshCw className="w-4 h-4 text-[#C2410C]" />;
    default:
      return <AlertCircle className="w-4 h-4 text-[#596579]" />;
  }
}

function getNotificationIconBg(type: NotificationType) {
  switch (type) {
    case 'New review required':
      return 'bg-[#FDF6ED] border-[#F0D4A6]';
    case 'Activity delayed':
      return 'bg-[#FBEFEE] border-[#E4B0AA]';
    case 'Dependency impacted':
      return 'bg-[#F3EFF8] border-[#D4C7E8]';
    case 'Match conflict':
      return 'bg-[#FDF6ED] border-[#F0D4A6]';
    case 'DPR confirmation required':
      return 'bg-[#EDF5F8] border-[#B3CBE0]';
    case 'Evidence uploaded':
      return 'bg-[#EDF7F2] border-[#B8DCC9]';
    case 'Processing failed':
      return 'bg-[#FBEFEE] border-[#E4B0AA]';
    case 'Sync conflict':
      return 'bg-[#FFF7ED] border-[#FED7AA]';
    default:
      return 'bg-[#F0F2F5] border-[#D9DEE5]';
  }
}

function getSeverityBadge(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical':
      return {
        label: 'Critical',
        className: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
      };
    case 'warning':
      return {
        label: 'Warning',
        className: 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]',
      };
    case 'medium':
      return {
        label: 'Medium',
        className: 'bg-[#FFF8E6] text-[#B87326] border-[#F0D4A6]',
      };
    case 'info':
    default:
      return {
        label: 'Info',
        className: 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]',
      };
  }
}

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
      className={`bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-sm flex flex-col ${className}`}
      data-testid="plnex-notification-center-panel"
    >
      {/* 1. Header Bar */}
      {showHeading && (
        <div className="p-4 border-b border-[#D9DEE5] bg-gradient-to-r from-white to-[#F7F8FA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#172033]">
                  Project Notification Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                  {unreadCount} unread
                </span>
              </div>
              <p className="text-[11px] text-[#596579]">
                Actionable construction alerts across reviews, delays, dependencies, and sync conflicts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-3 py-1.5 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={resetNotifications}
              className="p-1.5 text-[#8A94A6] hover:text-[#172033] hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-lg transition-colors"
              title="Reset notification feed to verified defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Controls & Search */}
      <div className="p-3 bg-[#F7F8FA] border-b border-[#D9DEE5] space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by title, description, activity ID (PIP-24-001)..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs text-[#172033] placeholder-[#8A94A6] focus:outline-none focus:border-[#176B87] focus:ring-1 focus:ring-[#176B87]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#8A94A6] hover:text-[#172033]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedType('ALL');
              setShowUnreadOnly(false);
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
              selectedType === 'ALL' && !showUnreadOnly
                ? 'bg-[#176B87] text-white border-[#176B87]'
                : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F0F2F5]'
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
              showUnreadOnly
                ? 'bg-[#176B87] text-white border-[#176B87]'
                : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F0F2F5]'
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
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#176B87] text-white border-[#176B87]'
                      : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F0F2F5]'
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
      <div className="divide-y divide-[#F0F2F5] overflow-y-auto max-h-[600px]">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#F0F2F5] text-[#8A94A6] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 text-[#2E7D5B]" />
            </div>
            <p className="text-xs font-bold text-[#172033]">
              No Notifications Found
            </p>
            <p className="text-[11px] text-[#596579] max-w-xs mx-auto">
              {showUnreadOnly
                ? 'All notifications have been addressed.'
                : 'No alerts match your filter criteria.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const severityCfg = getSeverityBadge(notification.severity);

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer group relative flex items-start gap-3.5 ${
                  !notification.isRead ? 'bg-[#F9FAFC]' : 'bg-white'
                }`}
              >
                {!notification.isRead && (
                  <span
                    className="absolute left-1 top-4 bottom-4 w-1 bg-[#176B87] rounded-r"
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#172033]">
                        {notification.type}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded border uppercase font-mono ${severityCfg.className}`}
                      >
                        {severityCfg.label}
                      </span>
                      {notification.sourceEntity && (
                        <span className="text-[10px] font-mono text-[#596579] bg-[#F0F2F5] px-1.5 py-0.2 rounded border border-[#D9DEE5]">
                          {notification.sourceEntity.id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#8A94A6]">
                      <Clock className="w-3 h-3" />
                      <span>{notification.relativeTime}</span>
                    </div>
                  </div>

                  <h4
                    className={`text-xs text-[#172033] leading-snug ${
                      !notification.isRead ? 'font-bold' : 'font-semibold'
                    }`}
                  >
                    {notification.title}
                  </h4>

                  <p className="text-[11px] text-[#596579] leading-relaxed">
                    {notification.description}
                  </p>

                  <div className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B87] group-hover:underline">
                      <span>{notification.destination.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
                        className="p-1 text-[#8A94A6] hover:text-[#172033] hover:bg-[#E5E9F0] rounded transition-colors"
                        title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {notification.isRead ? (
                          <Mail className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#2E7D5B]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissNotification(notification.id)}
                        className="p-1 text-[#8A94A6] hover:text-[#B5473C] hover:bg-[#FBEFEE] rounded transition-colors"
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
