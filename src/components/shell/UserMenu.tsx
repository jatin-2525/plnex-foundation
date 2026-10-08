'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Shield, User, LogOut, Check, LayoutDashboard, HardHat } from 'lucide-react';

export function UserMenu() {
  const router = useRouter();
  const { userSession, logout, setUserRole } = useApp();
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
    manager: 'Manager',
    engineer: 'Site Engineer',
    admin: 'Admin',
  };

  const displayName = userSession?.name || 'Authorized User';
  const displayRole = roleNameMap[userSession?.role || 'manager'] || 'Manager';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-md hover:bg-[#F1F3F5] transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-6 h-6 rounded bg-[#176B87] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-left min-w-0">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#172033] leading-tight truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-[#596579] leading-none mt-0.5">
              {displayRole}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-[#596579] flex-shrink-0 ml-0.5" />
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#596579] sm:hidden flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User Details */}
          <div className="p-4 border-b border-[#D9DEE5] bg-[#F7F8FA]">
            <p className="text-xs font-bold text-[#172033]">{userSession?.name}</p>
            <p className="text-[11px] text-[#596579]">{userSession?.email}</p>
            <p className="text-[11px] text-[#176B87] font-medium mt-1">
              {userSession?.title} • {displayRole}
            </p>
            <p className="text-[10px] text-[#596579] mt-0.5">{userSession?.organization}</p>
          </div>

          {/* Admin Explicit Role View Switcher */}
          {userSession?.role === 'admin' && (
            <div className="p-2 border-b border-[#D9DEE5]">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#596579] flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#176B87]" />
                <span>Admin View Switcher</span>
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard');
                  }}
                  className="w-full text-left p-2 rounded flex items-center gap-2 hover:bg-[#F1F3F5] text-xs text-[#172033]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#176B87]" />
                  <span>Switch to Manager View</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/engineer');
                  }}
                  className="w-full text-left p-2 rounded flex items-center gap-2 hover:bg-[#F1F3F5] text-xs text-[#172033]"
                >
                  <HardHat className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  <span>Switch to Engineer View</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/admin');
                  }}
                  className="w-full text-left p-2 rounded flex items-center gap-2 hover:bg-[#F1F3F5] text-xs text-[#176B87]"
                >
                  <Shield className="w-3.5 h-3.5 text-[#176B87]" />
                  <span>Admin Governance Hub</span>
                </button>
              </div>
            </div>
          )}

          {/* Sign Out Action */}
          <div className="p-1">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-xs text-[#B5473C] hover:bg-[#FBEFEE] rounded flex items-center gap-2 transition-colors cursor-pointer font-medium"
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
