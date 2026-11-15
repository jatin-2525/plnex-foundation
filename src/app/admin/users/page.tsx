'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Users, Shield, Plus, Check, Search, Filter } from 'lucide-react';
import { DEMO_USERS } from '../../../lib/api/authService';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'engineer' | 'admin'>('all');

  const usersList = Object.values(DEMO_USERS).map((item) => item.user);

  // Remove duplicates based on email
  const uniqueUsers = Array.from(
    new Map(usersList.map((u) => [u.email, u])).values()
  );

  const filteredUsers = uniqueUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const breadcrumbs = [
    { label: 'Administration', href: '/admin' },
    { label: 'Users & Roles', current: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Users & Role Management"
        description="Provision enterprise accounts, assign RBAC permissions, and enforce role separation across project controls personnel."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#006B61] hover:bg-[#00524A] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Provision New User
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#738A80] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or designation..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md focus:bg-white dark:focus:bg-[#243832] focus:border-[#006B61] dark:focus:border-[#72C6AD] text-[#1A2B25] dark:text-[#F2F4E9] placeholder:text-[#738A80] dark:placeholder:text-[#B9C2B8]/70 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md outline-none text-[#1A2B25] dark:text-[#F2F4E9]"
          >
            <option value="all">All Roles</option>
            <option value="manager">Manager</option>
            <option value="engineer">Site Engineer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Enterprise Directory Context Notice */}
      <div className="p-3 bg-[#EAF0E9] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD] shrink-0" />
          <span className="text-[#1A2B25] dark:text-[#F2F4E9]">
            <strong>Directory Scope:</strong> Displaying 6 active demo authentication profiles seeded from the central 38-user enterprise directory (local session sandbox).
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5] shrink-0">
          Directory Seed: 6 of 38 Profiles
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-[#1A2B25] dark:text-[#F2F4E9]">
              Authorized Personnel ({filteredUsers.length} Sample Profiles shown)
            </h3>
            <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
              38 Total enterprise user accounts provisioned in central PMIS directory
            </p>
          </div>
          <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-mono">Mock Directory (Session Mode)</span>
        </div>

        <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
          {filteredUsers.map((u) => {
            const isShortcut = u.email === 'manager@oilindia.in' || u.email === 'engineer@oilindia.in' || u.email === 'admin@oilindia.in';

            return (
              <div key={u.email} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFC] dark:hover:bg-[#243832]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] flex items-center justify-center font-bold text-xs font-mono">
                    {u.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9]">{u.name}</h4>
                      {isShortcut ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F8EFDA] dark:bg-[#243832] text-[#825700] dark:text-[#E5C185] border border-[#E5C185] dark:border-[#3A5146]">
                          Demo Shortcut Alias
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EAF0E9] dark:bg-[#101815] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
                          Primary Enterprise Persona
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5">{u.email} • {u.title}</p>
                    <p className="text-[10px] text-[#738A80] dark:text-[#B9C2B8]">{u.organization}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <span
                    className={`px-3 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-[#EAF0E9] dark:bg-[#243832] text-[#2C6475] dark:text-[#E5C185] border border-[#D9E2DA] dark:border-[#3A5146]'
                        : u.role === 'manager'
                        ? 'bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]'
                        : 'bg-[#E4F1E9] dark:bg-[#101815] text-[#1F6B4E] dark:text-[#72C6AD] border border-[#B7DAC3] dark:border-[#3A5146]'
                    }`}
                  >
                    {u.role}
                  </span>

                  <button
                    type="button"
                    className="px-3 py-1 text-xs text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded transition-colors"
                  >
                    Edit Permissions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
