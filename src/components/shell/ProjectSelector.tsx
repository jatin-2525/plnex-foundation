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
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#F1F3F5] hover:bg-[#E5E8EB] border border-[#D9DEE5] rounded-md text-left transition-colors max-w-[105px] sm:max-w-[320px] cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FolderGit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#176B87] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-xs font-bold text-[#172033] truncate">{activeProject.code}</span>
            <span className="text-[11px] text-[#596579] truncate hidden sm:inline">• {activeProject.name}</span>
          </div>
        </div>
        <ChevronDown className="w-3 h-3 text-[#596579] flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Scope notice banner */}
          <div className="px-3 py-2 bg-[#FDF6ED] border-b border-[#F0D4A6] text-[11px] text-[#8C5311]">
            <strong className="block font-bold">Simulated Demo Scope:</strong>
            Full schedule twin, S-curves, and field logs are actively simulated on <strong>OIL-DUL-01</strong>.
          </div>

          <div className="p-2 border-b border-[#D9DEE5] bg-[#F7F8FA]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project code or site..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-[#D9DEE5] rounded focus:border-[#176B87] outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-[#F1F3F5]">
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
                    isSelected ? 'bg-[#EDF5F8]' : 'hover:bg-[#F1F3F5]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#172033]">
                        {project.code}
                      </span>
                      {isDemoProject ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                          Active Baseline Twin
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] text-[#596579] bg-[#F1F3F5] border border-[#D9DEE5]">
                          Reference Record
                        </span>
                      )}
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                    <p className="text-xs text-[#172033] font-medium truncate">{project.name}</p>
                    <p className="text-[11px] text-[#596579] truncate">{project.location}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#176B87] flex-shrink-0 mt-0.5" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-4 text-center space-y-1">
                <p className="text-xs font-semibold text-[#172033]">No projects match your search</p>
                <p className="text-[11px] text-[#596579]">Check the project ID or name, or clear your query.</p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-1 text-[11px] font-semibold text-[#176B87] hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          <div className="p-2 bg-[#F7F8FA] border-t border-[#D9DEE5] text-[11px] text-[#596579] flex items-center justify-between">
            <span>Oil India Infrastructure PMIS</span>
            <span className="font-mono">{allProjects.length} Projects Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
