'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  ChevronDown,
  Shield,
  User,
  LogOut,
  Sliders,
  Sun,
  Moon,
  Laptop,
  LayoutDashboard,
  HardHat,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

export function UserMenu() {
  const router = useRouter();
  const { userSession, logout } = useApp();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { openSettings } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setIsOpen(false);
    logout();
    router.replace('/login');
  };

  const roleNameMap: Record<string, string> = {
    manager: 'Project Controls Manager',
    engineer: 'Lead Site Engineer',
    admin: 'Enterprise Admin',
  };

  const displayName = userSession?.name || 'Rajesh Sharma';
  const displayRole = roleNameMap[userSession?.role || 'manager'] || 'Project Controls Manager';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-[#EAF0E9] dark:hover:bg-[#243832] transition-colors cursor-pointer border border-transparent hover:border-[#D9E2DA] dark:hover:border-[#3A5146]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile and preferences"
      >
        <div className="w-6 h-6 rounded-md bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] flex items-center justify-center text-xs font-bold flex-shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-left min-w-0">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] leading-tight truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] leading-none mt-0.5">
              {displayRole}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-[#52665D] dark:text-[#B5C1B5] flex-shrink-0 ml-0.5" />
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5] sm:hidden flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl shadow-xl z-50 overflow-hidden text-xs text-[#1A2B25] dark:text-[#F2F4E9] animate-in fade-in duration-100">
          {/* User Details */}
          <div className="p-3.5 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815]">
            <p className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] font-heading">{displayName}</p>
            <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">{userSession?.email || 'manager@oilindia.in'}</p>
            <p className="text-[11px] text-[#006B61] dark:text-[#72C6AD] font-semibold mt-1">
              {userSession?.title || 'Chief Project Controls Manager'}
            </p>
            <p className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5">{userSession?.organization || 'Oil India Limited'}</p>
          </div>

          {/* Quick Theme Switcher */}
          <div className="p-2.5 border-b border-[#D9E2DA] dark:border-[#3A5146]">
            <div className="text-[10px] uppercase font-semibold text-[#52665D] dark:text-[#B5C1B5] px-2 mb-1.5 tracking-wider">
              Theme Mode
            </div>
            <div className="grid grid-cols-3 gap-1 bg-[#F6F7F3] dark:bg-[#101815] p-0.5 rounded-lg border border-[#D9E2DA] dark:border-[#3A5146]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-white dark:bg-[#17221D] text-[#006B61] dark:text-[#72C6AD] font-bold shadow-2xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
                title="Light Theme"
              >
                <Sun className="w-3 h-3 text-[#006B61]" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] font-bold shadow-2xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
                title="Dark Theme"
              >
                <Moon className="w-3 h-3 text-[#E9C46A]" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors ${
                  theme === 'system'
                    ? 'bg-white dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] font-bold shadow-2xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
                title="Follow System Theme"
              >
                <Laptop className="w-3 h-3" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* Preferences Link */}
          <div className="p-1 border-b border-[#D9E2DA] dark:border-[#3A5146]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openSettings(userSession?.role === 'engineer' ? 'engineer' : 'manager');
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-[#1A2B25] dark:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-md flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                <span className="font-semibold">Display & Workflow Settings</span>
              </div>
              <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Configure</span>
            </button>
          </div>

          {/* Admin Workspace Access */}
          {userSession?.role === 'admin' && (
            <div className="p-1.5 border-b border-[#D9E2DA] dark:border-[#3A5146]">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#006B61] dark:text-[#72C6AD]" />
                <span>Workspaces</span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/admin');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-xs text-[#1A2B25] dark:text-[#F2F4E9]"
                >
                  <Shield className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Admin Workspace (/admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-xs text-[#1A2B25] dark:text-[#F2F4E9]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Manager Workspace (/dashboard)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/engineer');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-xs text-[#1A2B25] dark:text-[#F2F4E9]"
                >
                  <HardHat className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Site Engineer Workspace (/engineer)</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages Link */}
          <div className="p-1 border-b border-[#D9E2DA] dark:border-[#3A5146]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/messages');
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-[#1A2B25] dark:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-md flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                <span className="font-semibold">Messages</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F8EFDA] dark:bg-[#3A3120] text-[#825700] dark:text-[#F3D27E] font-bold border border-[#E5C185] dark:border-[#5B4A2B]">
                {userSession?.role === 'engineer' ? '1 unread' : '2 unread'}
              </span>
            </button>
          </div>

          {/* Help & Support Link */}
          <div className="p-1 border-b border-[#D9E2DA] dark:border-[#3A5146]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/support');
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-[#1A2B25] dark:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-md flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                <span className="font-semibold">Help & Support</span>
              </div>
              <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">FAQs & Request</span>
            </button>
          </div>

          {/* Sign Out Action */}
          <div className="p-1">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-2.5 py-1.5 text-xs text-[#A43B36] dark:text-[#FF9E94] hover:bg-[#F6E4E1] dark:hover:bg-[#3B2422] rounded-md flex items-center gap-2 transition-colors cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
