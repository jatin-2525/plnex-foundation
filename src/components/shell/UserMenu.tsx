'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ChevronDown, Shield, User, LogOut, Check } from 'lucide-react';

export function UserMenu() {
  const { userSession, setUserRole } = useApp();
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

  const roles: Array<{ role: UserRole; label: string; desc: string }> = [
    { role: 'manager', label: 'Project Manager', desc: 'Can review, approve, override matches & simulate' },
    { role: 'engineer', label: 'Site Engineer', desc: 'Can submit DPRs, capture photos & verify field data' },
    { role: 'admin', label: 'Administrator', desc: 'Full system permissions & schedule imports' },
    { role: 'viewer', label: 'Viewer / Auditor', desc: 'Read-only access to progress, variance & audit log' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-[#F0F2F5] transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-md bg-[#176B87] text-white flex items-center justify-center text-xs font-bold font-mono">
          {userSession.avatar}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-[#172033] leading-none">
            {userSession.name}
          </span>
          <span className="text-[10px] text-[#596579] uppercase font-mono mt-0.5">
            {userSession.role}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#596579]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-3 border-b border-[#D9DEE5] bg-[#F7F8FA]">
            <p className="text-xs font-bold text-[#172033]">{userSession.name}</p>
            <p className="text-[11px] text-[#596579]">{userSession.title}</p>
            <p className="text-[11px] text-[#176B87] font-mono mt-0.5">{userSession.organization}</p>
          </div>

          <div className="p-2 border-b border-[#D9DEE5]">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#176B87]" />
              <span>Switch Active Role (RBAC Simulation)</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {roles.map((r) => {
                const isSelected = userSession.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => {
                      setUserRole(r.role);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded flex items-start justify-between transition-colors ${
                      isSelected ? 'bg-[#EDF5F8] text-[#176B87]' : 'hover:bg-[#F0F2F5] text-[#172033]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium">{r.label}</p>
                      <p className="text-[10px] text-[#596579] leading-tight">{r.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#176B87] flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-1">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] hover:bg-[#F0F2F5] rounded flex items-center gap-2 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>User Profile & Security Keys</span>
            </button>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-1.5 text-xs text-[#B5473C] hover:bg-[#FBEFEE] rounded flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
