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
  Sparkles,
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
function getNotificationTypeIcon(type: NotificationType) {
  switch (type) {
    case 'New review required':
      return <Sparkles className="w-4 h-4 text-[#D98B32]" />;
    case 'Activity delayed':
      return <TrendingDown className="w-4 h-4 text-[#B5473C]" />;
    case 'Dependency impacted':
      return <GitBranch className="w-4 h-4 text-[#3B6EA8]" />;
    case 'Match conflict':
      return <AlertTriangle className="w-4 h-4 text-[#D98B32]" />;
    case 'DPR confirmation required':
      return <FileText className="w-4 h-4 text-[#176B87]" />;
    case 'Evidence uploaded':
      return <Camera className="w-4 h-4 text-[#2E7D5B]" />;
    case 'Processing failed':
      return <XCircle className="w-4 h-4 text-[#B5473C]" />;
    case 'Sync conflict':
      return <RefreshCw className="w-4 h-4 text-[#D98B32]" />;
    default:
      return <AlertCircle className="w-4 h-4 text-[#596579]" />;
  }
}

// Background container color for notification icon
function getNotificationIconBg(type: NotificationType) {
  switch (type) {
    case 'New review required':
      return 'bg-[#FDF6ED] border-[#F0D4A6]';
    case 'Activity delayed':
      return 'bg-[#FBEFEE] border-[#E4B0AA]';
    case 'Dependency impacted':
      return 'bg-[#EDF5F8] border-[#B3CBE0]';
    case 'Match conflict':
      return 'bg-[#FDF6ED] border-[#F0D4A6]';
    case 'DPR confirmation required':
      return 'bg-[#EDF5F8] border-[#B3CBE0]';
    case 'Evidence uploaded':
      return 'bg-[#EDF7F2] border-[#B8DCC9]';
    case 'Processing failed':
      return 'bg-[#FBEFEE] border-[#E4B0AA]';
    case 'Sync conflict':
      return 'bg-[#FDF6ED] border-[#F0D4A6]';
    default:
      return 'bg-[#F1F3F5] border-[#D9DEE5]';
  }
}

// Severity pill styling
function getSeverityBadge(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical':
      return {
        label: 'Critical',
        className: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
      };
    case 'warning':
    case 'medium':
      return {
        label: severity === 'warning' ? 'Warning' : 'Medium',
        className: 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]',
      };
    case 'info':
    default:
      return {
        label: 'Info',
        className: 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]',
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
        className={`relative p-2 rounded-lg transition-colors flex items-center justify-center ${
          isOpen
            ? 'bg-[#EDF5F8] text-[#176B87]'
            : 'text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5]'
        }`}
        aria-label="View PLnEX Project Notifications"
        aria-expanded={isOpen}
        title="PLnEX Notification Center — Real-time project controls feed"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#B5473C] text-white rounded-full text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-white animate-in zoom-in-75">
            {unreadCount}
          </span>
        )}
      </button>

      {/* -------------------------------------------------------------------
          FLYOUT PANEL: ENTERPRISE NOTIFICATION CENTER
          ------------------------------------------------------------------- */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[92vw] sm:w-[480px] md:w-[520px] max-w-[540px] bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
          role="dialog"
          aria-label="Notification Center"
        >
          {/* 1. Header Bar */}
          <div className="p-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Notification Center
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                    {unreadCount} unread
                  </span>
                </div>
                <p className="text-[11px] text-[#596579]">
                  Live field-to-schedule alerts and verification requirements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#176B87] hover:bg-[#EDF5F8] rounded-md transition-colors"
                  title="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#7B8798] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-md transition-colors"
                aria-label="Close notification center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Search & Filter Bar */}
          <div className="p-3 bg-[#F7F8FA] border-b border-[#D9DEE5] space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts, activities (PIP-24-001), events, DPRs..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#D9DEE5] rounded-lg text-xs text-[#172033] placeholder-[#7B8798] focus:outline-none focus:border-[#176B87] focus:ring-1 focus:ring-[#176B87]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#7B8798] hover:text-[#172033]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedType('ALL');
                  setShowUnreadOnly(false);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  selectedType === 'ALL' && !showUnreadOnly
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  showUnreadOnly
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
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
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#176B87] text-white border-[#176B87]'
                          : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
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
          <div className="flex-1 overflow-y-auto divide-y divide-[#D9DEE5] max-h-[55vh]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-[#F1F3F5] text-[#7B8798] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 text-[#2E7D5B]" />
                </div>
                <p className="text-xs font-bold text-[#172033]">
                  No Notifications Found
                </p>
                <p className="text-[11px] text-[#596579] max-w-xs mx-auto">
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
                    className="text-xs text-[#176B87] font-semibold hover:underline mt-1 inline-block"
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
                    className={`p-3.5 sm:p-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer group relative flex items-start gap-3.5 ${
                      !notification.isRead ? 'bg-[#F9FAFC]' : 'bg-white'
                    }`}
                  >
                    {/* Unread Indicator Bar / Dot */}
                    {!notification.isRead && (
                      <span
                        className="absolute left-1 top-4 bottom-4 w-1 bg-[#176B87] rounded-r"
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
                            <span className="text-[10px] font-mono text-[#596579] bg-[#F1F3F5] px-1.5 py-0.2 rounded border border-[#D9DEE5]">
                              {notification.sourceEntity.id}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#7B8798]">
                          <Clock className="w-3 h-3" />
                          <span>{notification.relativeTime}</span>
                        </div>
                      </div>

                      {/* Notification Title */}
                      <h4
                        className={`text-xs text-[#172033] leading-snug ${
                          !notification.isRead ? 'font-bold' : 'font-semibold'
                        }`}
                      >
                        {notification.title}
                      </h4>

                      {/* Description Text */}
                      <p className="text-[11px] text-[#596579] leading-relaxed line-clamp-2">
                        {notification.description}
                      </p>

                      {/* Bottom Action Footer */}
                      <div className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                        {/* Primary Action Button */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B87] group-hover:underline">
                          <span>{notification.destination.actionLabel}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
                            className="p-1 text-[#7B8798] hover:text-[#172033] hover:bg-[#F1F3F5] rounded transition-colors"
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
                            className="p-1 text-[#7B8798] hover:text-[#B5473C] hover:bg-[#FBEFEE] rounded transition-colors"
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
          <div className="p-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-between text-xs text-[#596579] flex-wrap gap-2">
            <div className="flex items-center gap-3 text-[11px]">
              <Link
                href="/review"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#176B87] font-semibold flex items-center gap-1"
              >
                <span>Review Queue</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/health"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#176B87] font-semibold flex items-center gap-1"
              >
                <span>Data Health</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/sync"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#176B87] font-semibold flex items-center gap-1"
              >
                <span>Sync Center</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <button
              type="button"
              onClick={resetNotifications}
              className="text-[10px] text-[#7B8798] hover:text-[#172033] flex items-center gap-1"
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
