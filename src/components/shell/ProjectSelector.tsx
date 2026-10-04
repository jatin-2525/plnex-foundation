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
        className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F0F2F5] hover:bg-[#E8EBF0] border border-[#D9DEE5] rounded-lg text-left transition-colors max-w-[280px] sm:max-w-[340px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FolderGit2 className="w-4 h-4 text-[#176B87] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-[#172033]">{activeProject.code}</span>
            <span className="text-[10px] text-[#596579] truncate">• {activeProject.name}</span>
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#596579] flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-2 border-b border-[#D9DEE5] bg-[#F7F8FA]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-2.5 top-1/2 -translate-y-1/2" />
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

          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-[#F0F2F5]">
            {filtered.map((project) => {
              const isSelected = project.id === activeProject.id;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-md flex items-start justify-between gap-2 transition-colors ${
                    isSelected ? 'bg-[#EDF5F8]' : 'hover:bg-[#F0F2F5]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-[#172033]">
                        {project.code}
                      </span>
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
              <p className="p-4 text-center text-xs text-[#596579]">No matching projects found</p>
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
