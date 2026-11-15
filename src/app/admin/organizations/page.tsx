'use client';

import React from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Building2, Plus, Shield, MapPin, Briefcase } from 'lucide-react';

export default function AdminOrganizationsPage() {
  const orgs = [
    {
      id: 'ORG-OIL-01',
      name: 'Oil India Limited (Headquarters & Field Assets)',
      type: 'Owner Operator (PSU)',
      locations: 'Duliajan, Naharkatiya, Baghjan, Moran, Guwahati',
      projects: 6,
      activeUsers: 24,
      status: 'Active Operator',
    },
    {
      id: 'ORG-BECC-02',
      name: 'Brahmaputra Engineering & Construction Consortium',
      type: 'Primary EPC Contractor',
      locations: 'Duliajan Gas Processing Unit A',
      projects: 1,
      activeUsers: 8,
      status: 'Contract Active',
    },
    {
      id: 'ORG-LT-03',
      name: 'Larsen & Toubro Hydrocarbon Ltd.',
      type: 'EPC Pipeline Contractor',
      locations: 'Numaligarh-Siliguri Product Pipeline Corridor',
      projects: 1,
      activeUsers: 4,
      status: 'Contract Active',
    },
    {
      id: 'ORG-PM-04',
      name: 'PetroMech Solutions India Ltd.',
      type: 'Mechanical Subcontractor',
      locations: 'Moran Field Modernization',
      projects: 1,
      activeUsers: 2,
      status: 'Subcontractor',
    },
    {
      id: 'ORG-RITES-05',
      name: 'RITES Limited (Govt. of India Enterprise)',
      type: 'Third Party Inspection & Quality Audit',
      locations: 'Duliajan & Regional QC Labs',
      projects: 1,
      activeUsers: 2,
      status: 'Active TPI',
    },
    {
      id: 'ORG-GAIL-06',
      name: 'GAIL (India) Limited',
      type: 'Gas Offtaker & Interconnect Partner',
      locations: 'Assam Gas Grid Interconnect Station',
      projects: 1,
      activeUsers: 2,
      status: 'Commercial Partner',
    },
  ];

  const breadcrumbs = [
    { label: 'Administration', href: '/admin' },
    { label: 'Organizations', current: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Organizations & Contracting Consortia"
        description="Tenant organizations, EPC joint ventures, and contracting partner registries with partitioned project workspace scopes."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Organization
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map((org) => (
          <div key={org.id} className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#006B61] dark:text-[#72C6AD] bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] px-2 py-0.5 rounded">
                  {org.id}
                </span>
                <span className="text-[11px] font-semibold text-[#1F6B4E] dark:text-[#34D399] bg-[#E4F1E9] dark:bg-[#0D3322] border border-[#B7DAC3] dark:border-[#1E5C3E] px-2 py-0.5 rounded">
                  {org.status}
                </span>
              </div>
              <h3 className="text-sm font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9]">{org.name}</h3>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5 font-medium">{org.type}</p>

              <div className="mt-3 space-y-2 text-xs text-[#52665D] dark:text-[#B5C1B5]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
                  <span>{org.locations}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
                  <span>{org.projects} Linked Projects • {org.activeUsers} Personnel</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-end">
              <button
                type="button"
                className="px-3 py-1 text-xs text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#3A5146] rounded font-medium transition-colors"
              >
                Configure Workspace Access
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
