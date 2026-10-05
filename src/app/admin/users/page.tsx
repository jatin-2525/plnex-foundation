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
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Users & Role Management"
        description="Provision enterprise accounts, assign RBAC permissions, and enforce role separation across project controls personnel."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Provision New User
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or designation..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-md focus:bg-white focus:border-[#176B87] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#596579]">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-md outline-none text-[#172033]"
          >
            <option value="all">All Roles</option>
            <option value="manager">Manager</option>
            <option value="engineer">Site Engineer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579]">
            Authorized Personnel ({filteredUsers.length})
          </h3>
          <span className="text-xs text-[#176B87] font-mono">IAM Directory Sync Active</span>
        </div>

        <div className="divide-y divide-[#D9DEE5]">
          {filteredUsers.map((u) => (
            <div key={u.email} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#176B87] text-white flex items-center justify-center font-bold text-xs font-mono">
                  {u.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172033]">{u.name}</h4>
                  <p className="text-[11px] text-[#596579]">{u.email} • {u.title}</p>
                  <p className="text-[10px] text-[#7B8798]">{u.organization}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                    u.role === 'admin'
                      ? 'bg-[#EDF5F8] text-[#3B6EA8] border border-[#B3CBE0]'
                      : u.role === 'manager'
                      ? 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                      : 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                  }`}
                >
                  {u.role}
                </span>

                <button
                  type="button"
                  className="px-2.5 py-1 text-xs text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded transition-colors"
                >
                  Edit Permissions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
