'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  Filter,
  Check,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  RotateCcw,
  Layers,
  ShieldCheck,
  ChevronRight,
  Mail,
  MailOpen,
  Wifi,
} from 'lucide-react';

// Icon mapper for the 8 required notification types
export function getNotificationTypeIcon(type: NotificationType) {
  switch (type) {
    case 'New review required':
      return <ClipboardCheck className="w-4 h-4 text-[#825700]" />;
    case 'Activity delayed':
      return <TrendingDown className="w-4 h-4 text-[#A43B36]" />;
    case 'Dependency impacted':
      return <GitBranch className="w-4 h-4 text-[#2C6475]" />;
    case 'Match conflict':
      return <AlertTriangle className="w-4 h-4 text-[#825700]" />;
    case 'DPR confirmation required':
      return <FileText className="w-4 h-4 text-[#006B61]" />;
    case 'Evidence uploaded':
      return <Camera className="w-4 h-4 text-[#1F6B4E]" />;
    case 'Processing failed':
      return <XCircle className="w-4 h-4 text-[#A43B36]" />;
    case 'Sync conflict':
      return <RefreshCw className="w-4 h-4 text-[#825700]" />;
    default:
      return <AlertCircle className="w-4 h-4 text-[#52665D]" />;
  }
}

// Background container color for notification icon
export function getNotificationIconBg(type: NotificationType) {
  switch (type) {
    case 'New review required':
      return 'bg-[#F8EFDA] border-[#E5C185]';
    case 'Activity delayed':
      return 'bg-[#F6E4E1] border-[#DCABA7]';
    case 'Dependency impacted':
      return 'bg-[#EAF0E9] border-[#D9E2DA]';
    case 'Match conflict':
      return 'bg-[#F8EFDA] border-[#E5C185]';
    case 'DPR confirmation required':
      return 'bg-[#EAF0E9] border-[#D9E2DA]';
    case 'Evidence uploaded':
      return 'bg-[#E4F1E9] border-[#B7DAC3]';
    case 'Processing failed':
      return 'bg-[#F6E4E1] border-[#DCABA7]';
    case 'Sync conflict':
      return 'bg-[#F8EFDA] border-[#E5C185]';
    default:
      return 'bg-[#EAF0E9] border-[#D9E2DA]';
  }
}

// Severity pill styling
export function getSeverityBadge(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical':
      return {
        label: 'Critical',
        className: 'bg-[#F6E4E1] text-[#A43B36] border-[#DCABA7]',
      };
    case 'warning':
    case 'medium':
      return {
        label: severity === 'warning' ? 'Warning' : 'Medium',
        className: 'bg-[#F8EFDA] text-[#825700] border-[#E5C185]',
      };
    case 'info':
    default:
      return {
        label: 'Info',
        className: 'bg-[#EAF0E9] text-[#006B61] border-[#D9E2DA]',
      };
  }
}

export function NotificationCenter() {
  const {
    notifications,
    filteredNotifications,
    unreadCount,
    isOpen,
    setIsOpen,
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

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Filter categories
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
    <div className="relative" ref={containerRef}>
      {/* -------------------------------------------------------------------
          TRIGGER: BELL BUTTON WITH UNREAD COUNTER
          ------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-md transition-colors flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-[#EAF0E9] text-[#006B61]'
            : 'text-[#52665D] hover:text-[#1A2B25] hover:bg-[#EAF0E9]'
        }`}
        aria-label="View PLnEX Project Notifications"
        aria-expanded={isOpen}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#92372F] text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* -------------------------------------------------------------------
          FLYOUT PANEL: ENTERPRISE NOTIFICATION CENTER
          ------------------------------------------------------------------- */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[92vw] sm:w-[480px] md:w-[520px] max-w-[540px] bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-lg z-50 overflow-hidden flex flex-col max-h-[85vh]"
          role="dialog"
          aria-label="Notification Center"
        >
          {/* 1. Header Bar */}
          <div className="p-4 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center text-[#006B61] dark:text-[#72C6AD]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                    Notification Center
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
                    {unreadCount} unread
                  </span>
                </div>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Live field-to-schedule alerts and verification requirements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-3 py-1 text-[11px] font-semibold text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-md transition-colors"
                  title="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-md transition-colors"
                aria-label="Close notification center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Search & Filter Bar */}
          <div className="p-3 bg-[#F6F7F3] dark:bg-[#101815] border-b border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts, activities (PIP-24-001), events, DPRs..."
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] dark:placeholder-[#64748B] focus:outline-none focus:border-[#006B61] dark:focus:border-[#72C6AD] focus:ring-1 focus:ring-[#006B61]"
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

            {/* Filter Pills Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedType('ALL');
                  setShowUnreadOnly(false);
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  selectedType === 'ALL' && !showUnreadOnly
                    ? 'bg-[#006B61] text-white border-[#006B61]'
                    : 'bg-white dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  showUnreadOnly
                    ? 'bg-[#006B61] text-white border-[#006B61]'
                    : 'bg-white dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
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
                          ? 'bg-[#006B61] text-white border-[#006B61]'
                          : 'bg-white dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
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

          {/* 3. Notification Feed List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#D9E2DA] dark:divide-[#3A5146] max-h-[55vh]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] text-[#738A80] dark:text-[#859688] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 text-[#1F6B4E] dark:text-[#72C6AD]" />
                </div>
                <p className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                  No Notifications Found
                </p>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] max-w-xs mx-auto">
                  {showUnreadOnly
                    ? 'All notifications have been reviewed and acknowledged.'
                    : 'No project controls events match the active search filter.'}
                </p>
                {(searchQuery || selectedType !== 'ALL' || showUnreadOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('ALL');
                      setShowUnreadOnly(false);
                    }}
                    className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold hover:underline mt-1 inline-block"
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
                    className={`p-4 sm:p-4 hover:bg-[#F6F7F3] dark:hover:bg-[#243832] transition-colors cursor-pointer group relative flex items-start gap-4 ${
                      !notification.isRead ? 'bg-[#F9FAFC] dark:bg-[#142135]' : 'bg-white dark:bg-[#17221D]'
                    }`}
                  >
                    {/* Unread Indicator Bar / Dot */}
                    {!notification.isRead && (
                      <span
                        className="absolute left-1 top-4 bottom-4 w-1 bg-[#006B61] dark:bg-[#72C6AD] rounded-r"
                        title="Unread"
                      />
                    )}

                    {/* Icon Avatar */}
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getNotificationIconBg(
                        notification.type
                      )}`}
                    >
                      {getNotificationTypeIcon(notification.type)}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Top Meta Line: Type Pill + Severity + Timestamp */}
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
                            <span className="text-[10px] font-mono text-[#52665D] dark:text-[#B5C1B5] bg-[#EAF0E9] dark:bg-[#243832] px-1.5 py-0.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                              {notification.sourceEntity.id}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#738A80] dark:text-[#859688]">
                          <Clock className="w-3 h-3" />
                          <span>{notification.relativeTime}</span>
                        </div>
                      </div>

                      {/* Notification Title */}
                      <h4
                        className={`text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-snug ${
                          !notification.isRead ? 'font-bold' : 'font-semibold'
                        }`}
                      >
                        {notification.title}
                      </h4>

                      {/* Description Text */}
                      <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] leading-relaxed line-clamp-2">
                        {notification.description}
                      </p>

                      {/* Bottom Action Footer */}
                      <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                        {/* Primary Action Button */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006B61] dark:text-[#72C6AD] group-hover:underline">
                          <span>{notification.destination.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>

                        {/* Mark Read / Unread / Dismiss Actions */}
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
                              <Check className="w-3.5 h-3.5 text-[#1F6B4E] dark:text-[#72C6AD]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 text-[#738A80] dark:text-[#859688] hover:text-[#A43B36] dark:hover:text-[#F87171] hover:bg-[#F6E4E1] dark:hover:bg-[#331517] rounded transition-colors"
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

          {/* 4. Footer Bar */}
          <div className="p-3 bg-[#F6F7F3] dark:bg-[#101815] border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5] flex-wrap gap-2">
            <div className="flex items-center gap-3 text-[11px]">
              <Link
                href="/review"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#006B61] dark:hover:text-[#72C6AD] font-semibold flex items-center gap-1"
              >
                <span>Review Queue</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/health"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#006B61] dark:hover:text-[#72C6AD] font-semibold flex items-center gap-1"
              >
                <span>Data Health</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/sync"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#006B61] dark:hover:text-[#72C6AD] font-semibold flex items-center gap-1"
              >
                <span>Sync Center</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <button
              type="button"
              onClick={resetNotifications}
              className="text-[10px] text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] flex items-center gap-1"
              title="Reset all notifications to initial verified state"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Feed</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
