'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, FolderGit2, Check, Search } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';

export function ProjectSelector() {
  const { activeProject, setActiveProjectId, allProjects } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filtered = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA] dark:hover:bg-[#3A5146] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md text-left transition-colors max-w-[105px] sm:max-w-[320px] cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FolderGit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006B61] dark:text-[#72C6AD] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] truncate">{activeProject.code}</span>
            <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] truncate hidden sm:inline">• {activeProject.name}</span>
          </div>
        </div>
        <ChevronDown className="w-3 h-3 text-[#52665D] dark:text-[#B5C1B5] flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Scope notice banner */}
          <div className="px-3 py-2 bg-[#F8EFDA] dark:bg-[#3A3120] border-b border-[#E5C185] dark:border-[#5B4A2B] text-[11px] text-[#825700] dark:text-[#F3D27E]">
            <strong className="block font-bold">Simulated Demo Scope:</strong>
            Full schedule twin, S-curves, and field logs are actively simulated on <strong>OIL-DUL-01</strong>.
          </div>

          <div className="p-2 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project code or site..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded focus:border-[#006B61] dark:focus:border-[#72C6AD] outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
            {filtered.map((project) => {
              const isSelected = project.id === activeProject.id;
              const isDemoProject = project.code === 'OIL-DUL-01' || project.id === 'PRJ-OIL-2026-01';
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-md flex items-start justify-between gap-2 transition-colors ${
                    isSelected ? 'bg-[#EAF0E9] dark:bg-[#243832]' : 'hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                        {project.code}
                      </span>
                      {isDemoProject ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#E4F1E9] dark:bg-[#20382C] text-[#1F6B4E] dark:text-[#9AD5AF] border border-[#B7DAC3] dark:border-[#315442]">
                          Active Baseline Twin
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] text-[#52665D] dark:text-[#B5C1B5] bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146]">
                          Reference Record
                        </span>
                      )}
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                    <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] font-medium truncate">{project.name}</p>
                    <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] truncate">{project.location}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD] flex-shrink-0 mt-0.5" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-4 text-center space-y-1">
                <p className="text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">No projects match your search</p>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">Check the project ID or name, or clear your query.</p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-1 text-[11px] font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          <div className="p-2 bg-[#F6F7F3] dark:bg-[#101815] border-t border-[#D9E2DA] dark:border-[#3A5146] text-[11px] text-[#52665D] dark:text-[#B5C1B5] flex items-center justify-between">
            <span>Oil India Infrastructure PMIS</span>
            <span className="font-mono">{allProjects.length} Projects Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
