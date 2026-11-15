'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import {
  MessageSquare,
  Search,
  Filter,
  Paperclip,
  Send,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  ChevronRight,
  FolderKanban,
  HardHat,
  User,
  Info,
  Calendar,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface ChatAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'manager' | 'engineer' | 'admin';
  timestamp: string;
  content: string;
  activityId?: string;
  attachments?: ChatAttachment[];
  isLocalTest?: boolean;
}

export interface ConversationThread {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  counterpartId: string;
  counterpartName: string;
  counterpartRole: 'manager' | 'engineer';
  counterpartTitle: string;
  counterpartOrg: string;
  counterpartAvatar: string;
  lastMessageSnippet: string;
  lastMessageTime: string;
  unreadCount: number;
  criticalWbsCode?: string;
  messages: ChatMessage[];
}

export default function MessagesPage() {
  const { userSession, activeProject } = useApp();
  const currentRole = userSession?.role || 'manager';
  const currentUserId = userSession?.id || `USR-${currentRole.toUpperCase()}-001`;
  const currentUserName = userSession?.name || (currentRole === 'engineer' ? 'Debajit Borah' : 'Rajesh Sharma');

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Project Controls' },
    { label: 'Messages', current: true },
  ];

  // Initial Mock Conversations mapped strictly to existing MOCK_PROJECTS assignments
  const [conversations, setConversations] = useState<ConversationThread[]>([
    {
      id: 'conv-prj-01',
      projectId: 'PRJ-OIL-2026-01',
      projectCode: 'OIL-DUL-01',
      projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
      counterpartId: currentRole === 'engineer' ? 'USR-MGR-001' : 'USR-ENG-001',
      counterpartName: currentRole === 'engineer' ? 'Rajesh Sharma' : 'Debajit Borah',
      counterpartRole: currentRole === 'engineer' ? 'manager' : 'engineer',
      counterpartTitle: currentRole === 'engineer' ? 'Chief Project Controls Manager' : 'Lead Site Execution Engineer',
      counterpartOrg: 'Oil India Limited',
      counterpartAvatar: currentRole === 'engineer' ? 'RS' : 'DB',
      lastMessageSnippet: 'Understood. I have attached the crane lift inspection checklist and the joint alignment report.',
      lastMessageTime: '18 Sep, 16:45',
      unreadCount: 1,
      criticalWbsCode: 'PIP-24-001',
      messages: [
        {
          id: 'msg-101',
          senderId: 'USR-MGR-001',
          senderName: 'Rajesh Sharma',
          senderRole: 'manager',
          timestamp: '18 Sep 2026, 14:15',
          content: 'Debajit, reviewing the Schedule Twin for Duliajan before the joint progress committee. The S-curve indicates PIP-24-001 was completed yesterday, but PIP-24-002 shows a potential 2-day finish variance. What is the latest rigging status at Unit 02 flare?',
          activityId: 'PIP-24-001',
        },
        {
          id: 'msg-102',
          senderId: 'USR-ENG-001',
          senderName: 'Debajit Borah',
          senderRole: 'engineer',
          timestamp: '18 Sep 2026, 15:20',
          content: 'Rajesh-da, the heavy rigging crane at Unit 02 flare line experienced a 2-hour hydraulic pressure test hold this morning. We completed 100% of the spool placements for PIP-24-001, but the radiographic inspection team for PIP-24-002 was rescheduled to tomorrow 07:00 AM.',
          activityId: 'PIP-24-002',
        },
        {
          id: 'msg-103',
          senderId: 'USR-MGR-001',
          senderName: 'Rajesh Sharma',
          senderRole: 'manager',
          timestamp: '18 Sep 2026, 15:42',
          content: 'Good to know. If the NDT team clears the weld joint before 13:00 tomorrow, we can avoid consuming the 4-day total float on the Hydrotest predecessor chain. Please make sure the crane cert and spool tags are attached with the evening DPR.',
        },
        {
          id: 'msg-104',
          senderId: 'USR-ENG-001',
          senderName: 'Debajit Borah',
          senderRole: 'engineer',
          timestamp: '18 Sep 2026, 16:45',
          content: 'Understood. I have attached the crane lift inspection checklist and the joint alignment report. Field team is fully mobilized for morning radiography.',
          activityId: 'PIP-24-002',
          attachments: [
            { id: 'att-1', name: 'Crane_Rigging_Checklist_Unit02.pdf', size: '2.4 MB', type: 'application/pdf' },
            { id: 'att-2', name: 'Spool_Placement_Signoff_PIP24.xlsx', size: '840 KB', type: 'application/vnd.ms-excel' },
          ],
        },
      ],
    },
    {
      id: 'conv-prj-02',
      projectId: 'PRJ-OIL-2026-02',
      projectCode: 'OIL-NHK-04',
      projectName: 'Naharkatiya Crude Stabilization Facility',
      counterpartId: currentRole === 'engineer' ? 'USR-MGR-002' : 'USR-ENG-002',
      counterpartName: currentRole === 'engineer' ? 'Pranab Phukan' : 'Ankur Saikia',
      counterpartRole: currentRole === 'engineer' ? 'manager' : 'engineer',
      counterpartTitle: currentRole === 'engineer' ? 'Project Manager' : 'Site Engineer (Civil & Structural)',
      counterpartOrg: 'Eastern Infra Projects Ltd.',
      counterpartAvatar: currentRole === 'engineer' ? 'PP' : 'AS',
      lastMessageSnippet: 'Foundation pour for Tank 04 completed ahead of forecast. Ready for curing signoff.',
      lastMessageTime: '18 Sep, 11:20',
      unreadCount: 0,
      criticalWbsCode: 'CIV-11-001',
      messages: [
        {
          id: 'msg-201',
          senderId: 'USR-ENG-002',
          senderName: 'Ankur Saikia',
          senderRole: 'engineer',
          timestamp: '18 Sep 2026, 11:20',
          content: 'Foundation pour for Tank 04 completed ahead of forecast. Ready for curing signoff. Cube test compressive reports will be submitted in 7 days.',
          activityId: 'CIV-11-001',
        },
      ],
    },
    {
      id: 'conv-prj-03',
      projectId: 'PRJ-OIL-2026-03',
      projectCode: 'OIL-BGJ-02',
      projectName: 'Baghjan Field OCS-04 Expansion & Wellhead Tie-in',
      counterpartId: currentRole === 'engineer' ? 'USR-MGR-003' : 'USR-ENG-003',
      counterpartName: currentRole === 'engineer' ? 'Mridul Hazarika' : 'P. Baruah',
      counterpartRole: currentRole === 'engineer' ? 'manager' : 'engineer',
      counterpartTitle: currentRole === 'engineer' ? 'Project Lead' : 'Site QC Engineer',
      counterpartOrg: 'Assam Hydrocarbon Infra Ltd.',
      counterpartAvatar: currentRole === 'engineer' ? 'MH' : 'PB',
      lastMessageSnippet: 'Wellhead manifold manifold tie-in package needs revised welding procedure specification (WPS).',
      lastMessageTime: '17 Sep, 17:10',
      unreadCount: 1,
      criticalWbsCode: 'WHD-09-004',
      messages: [
        {
          id: 'msg-301',
          senderId: 'USR-ENG-003',
          senderName: 'P. Baruah',
          senderRole: 'engineer',
          timestamp: '17 Sep 2026, 17:10',
          content: 'Wellhead manifold tie-in package needs revised welding procedure specification (WPS) before we can strike an arc on high-pressure line 08. Can you push the consultant signoff?',
          activityId: 'WHD-09-004',
        },
      ],
    },
    {
      id: 'conv-prj-04',
      projectId: 'PRJ-OIL-2026-04',
      projectCode: 'NRL-OIL-PL-09',
      projectName: 'Numaligarh-Siliguri Product Pipeline Loop Section',
      counterpartId: currentRole === 'engineer' ? 'USR-MGR-004' : 'USR-ENG-004',
      counterpartName: currentRole === 'engineer' ? 'Deepak Sengupta' : 'S. K. Verma',
      counterpartRole: currentRole === 'engineer' ? 'manager' : 'engineer',
      counterpartTitle: currentRole === 'engineer' ? 'GM Pipeline Projects' : 'Resident Engineer',
      counterpartOrg: 'Larsen & Toubro Hydrocarbon Ltd.',
      counterpartAvatar: currentRole === 'engineer' ? 'DS' : 'SV',
      lastMessageSnippet: 'Trenching crossing at Ch. 42+100 cleared with local authorities.',
      lastMessageTime: '16 Sep, 18:30',
      unreadCount: 0,
      criticalWbsCode: 'TRN-42-010',
      messages: [
        {
          id: 'msg-401',
          senderId: 'USR-ENG-004',
          senderName: 'S. K. Verma',
          senderRole: 'engineer',
          timestamp: '16 Sep 2026, 18:30',
          content: 'Trenching crossing at Ch. 42+100 cleared with local authorities. HDD rig setup commencing Monday.',
          activityId: 'TRN-42-010',
        },
      ],
    },
  ]);

  // Selected thread & Search/Filter states
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-prj-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [projectScope, setProjectScope] = useState<'current' | 'all'>('current');

  // New message input & staging attachments
  const [replyText, setReplyText] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (projectScope === 'current' && c.projectId !== activeProject.id) return false;
      if (unreadOnly && c.unreadCount === 0) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.counterpartName.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q) ||
        c.projectCode.toLowerCase().includes(q) ||
        c.lastMessageSnippet.toLowerCase().includes(q) ||
        (c.criticalWbsCode && c.criticalWbsCode.toLowerCase().includes(q))
      );
    });
  }, [conversations, searchQuery, unreadOnly, projectScope, activeProject.id]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || conversations[0];
  }, [conversations, selectedConversationId]);

  // Scroll to bottom on new message or conversation change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, activeConversation?.messages.length]);

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setStagedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setStagedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Send Reply (Prototype Simulation)
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && stagedFiles.length === 0) return;

    const newAttachments: ChatAttachment[] = stagedFiles.map((f, i) => ({
      id: `att-staged-${Date.now()}-${i}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.type || 'application/octet-stream',
    }));

    const newMsg: ChatMessage = {
      id: `msg-local-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentRole as 'manager' | 'engineer' | 'admin',
      timestamp: 'Just now (18 Sep 2026)',
      content: replyText.trim(),
      attachments: newAttachments.length > 0 ? newAttachments : undefined,
      isLocalTest: true,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversation.id) {
          return {
            ...conv,
            lastMessageSnippet: replyText.trim() || `Sent ${newAttachments.length} file(s)`,
            lastMessageTime: 'Just now',
            unreadCount: 0,
            messages: [...conv.messages, newMsg],
          };
        }
        return conv;
      })
    );

    setReplyText('');
    setStagedFiles([]);
  };

  return (
    <div className="space-y-4 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      {/* Prototype Context Notice Banner */}
      <div className="bg-[#F6F7F3] dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-3 sm:p-4 text-xs shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded bg-[#F8EFDA] dark:bg-[#243832] text-[#825700] dark:text-[#E5C185] mt-0.5 shrink-0 border border-[#E5C185] dark:border-[#3A5146]">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                Manager–Engineer Field Communications
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#F8EFDA] dark:bg-[#243832] text-[#825700] dark:text-[#E5C185] border border-[#E5C185] dark:border-[#3A5146]">
                SIMULATED PROTOTYPE (LOCAL SESSION)
              </span>
            </div>
            <p className="text-[#566159] dark:text-[#B5C1B5] mt-0.5 leading-relaxed text-[11px]">
              One-to-one conversations mapped directly to project assignments in <strong className="font-mono text-[#1A2B25] dark:text-[#F2F4E9]">{activeProject.code}</strong> and active workfronts. Replies and staged attachments are held locally in your browser session. No fake delivery checkmarks or online indicators are rendered.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#566159] dark:text-[#B5C1B5] shrink-0">
          <span>Active Persona:</span>
          <span className="px-2 py-0.5 rounded bg-white dark:bg-[#243832] font-bold text-[#1A2B25] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
            {currentUserName} ({currentRole.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Main Container: Responsive Split Pane */}
      <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* =========================================================================
            LEFT COLUMN: Conversation Inbox & Filter List (Hidden on mobile if thread open)
            ========================================================================= */}
        <div
          className={`md:col-span-5 lg:col-span-4 border-r border-[#D9E2DA] dark:border-[#3A5146] flex flex-col ${
            selectedConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#566159] dark:text-[#B5C1B5] font-mono flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#1A2B25] dark:text-[#72C6AD]" />
                Conversations ({filteredConversations.length})
              </h2>
              <span className="text-[10px] font-mono text-[#566159] dark:text-[#B5C1B5]">
                {conversations.reduce((acc, c) => acc + c.unreadCount, 0)} Unread Total
              </span>
            </div>

            {/* Project Scope & Unread Filter Row */}
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProjectScope('current')}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors font-medium cursor-pointer ${
                    projectScope === 'current'
                      ? 'bg-[#103F39] text-white border-[#235F56] dark:bg-[#72C6AD] dark:text-[#0B2822]'
                      : 'bg-white dark:bg-[#17221D] text-[#566159] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                  title={`Filter to current project: ${activeProject.name}`}
                >
                  {activeProject.code} Scope
                </button>
                <button
                  type="button"
                  onClick={() => setProjectScope('all')}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors font-medium cursor-pointer ${
                    projectScope === 'all'
                      ? 'bg-[#103F39] text-white border-[#235F56] dark:bg-[#72C6AD] dark:text-[#0B2822]'
                      : 'bg-white dark:bg-[#17221D] text-[#566159] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                  title="Show all project threads in portfolio"
                >
                  All Projects
                </button>
              </div>
              <button
                type="button"
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors font-medium cursor-pointer ${
                  unreadOnly
                    ? 'bg-[#E5C185] text-[#0B2822] border-[#E5C185] font-bold'
                    : 'bg-white dark:bg-[#17221D] text-[#566159] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
              >
                Unread only
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#566159] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search engineer, project, WBS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#77827A] dark:placeholder-[#52665D] dark:placeholder-[#B5C1B5]/70 focus:outline-none focus:ring-1 focus:ring-[#006B61] dark:focus:ring-[#72C6AD]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77827A] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#566159] dark:text-[#B5C1B5] space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto text-[#77827A] opacity-60" />
                <p>No conversations match your filter criteria.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConversation.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      // Clear unread count locally when opened
                      setConversations((prev) =>
                        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                      );
                    }}
                    className={`w-full text-left p-3.5 transition-colors relative flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF0E9] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9]'
                        : 'hover:bg-[#F6F7F3] dark:hover:bg-[#243832] text-[#566159] dark:text-[#B5C1B5]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#103F39] dark:bg-[#72C6AD]" />
                    )}

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#1B3024] text-[#72C6AD] dark:bg-[#243832] dark:text-[#72C6AD] flex items-center justify-center font-bold text-xs shrink-0 border border-[#264333]">
                      {conv.counterpartAvatar}
                    </div>

                    {/* Metadata & Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs truncate ${isSelected ? 'font-bold text-[#1A2B25] dark:text-[#F2F4E9]' : 'font-semibold text-[#1A2B25] dark:text-[#F2F4E9]'}`}>
                          {conv.counterpartName}
                        </span>
                        <span className="text-[10px] text-[#77827A] font-mono shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[#566159] dark:text-[#B5C1B5] font-mono mb-1 truncate">
                        <span className="font-bold text-[#1A2B25] dark:text-[#72C6AD]">{conv.projectCode}</span>
                        <span>•</span>
                        <span className="truncate">{conv.counterpartTitle}</span>
                      </div>

                      <p className="text-[11px] text-[#566159] dark:text-[#B5C1B5] line-clamp-2 leading-relaxed">
                        {conv.lastMessageSnippet}
                      </p>

                      {/* Tags & Unread indicator */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#D9E2DA]/50 dark:border-[#3A5146]/50 text-[10px]">
                        {conv.criticalWbsCode && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] text-[#77827A]">
                            WBS: {conv.criticalWbsCode}
                          </span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-[#E5C185] text-[#1B281E] font-bold text-[10px]">
                            {conv.unreadCount} unread
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Active Conversation Stream & Staged Reply Composer
            ========================================================================= */}
        <div
          className={`md:col-span-7 lg:col-span-8 flex flex-col h-full ${
            selectedConversationId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-3.5 sm:px-5 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedConversationId('')}
                    className="md:hidden p-1.5 -ml-1 text-[#566159] hover:text-[#1A2B25] rounded-md hover:bg-[#EAF0E9]"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-[#1B3024] text-[#72C6AD] flex items-center justify-center font-bold text-sm shrink-0 border border-[#264333]">
                    {activeConversation.counterpartAvatar}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] truncate">
                        {activeConversation.counterpartName}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] font-mono text-[#566159] dark:text-[#B5C1B5]">
                        {activeConversation.counterpartOrg}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#566159] dark:text-[#B5C1B5] mt-0.5">
                      <span>{activeConversation.counterpartTitle}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-[#1A2B25] dark:text-[#72C6AD]">
                        {activeConversation.projectCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Context Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/projects/${activeConversation.projectId}`}
                    className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] text-[#1A2B25] dark:text-[#F2F4E9] transition-colors"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-[#1A2B25] dark:text-[#72C6AD]" />
                    <span>Project File</span>
                  </Link>
                  <Link
                    href="/schedule-twin"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] text-[#1A2B25] dark:text-[#F2F4E9] transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#3A6073] dark:text-[#8FB4C4]" />
                    <span className="hidden sm:inline">Schedule Twin</span>
                  </Link>
                </div>
              </div>

              {/* Message History Stream */}
              <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white dark:bg-[#17221D]"
                style={{ maxHeight: '440px', minHeight: '340px' }}
              >
                {/* Date Anchor */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-[#EAF0E9] dark:bg-[#243832] text-[11px] font-mono text-[#566159] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146]">
                    Reporting Date Anchor: 18 September 2026
                  </span>
                </div>

                {activeConversation.messages.map((msg) => {
                  const isCurrentUser = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-[#77827A] font-mono">
                          {msg.timestamp}
                        </span>
                        {msg.activityId && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EAF0E9] dark:bg-[#243832] text-[#1A2B25] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
                            {msg.activityId}
                          </span>
                        )}
                        {msg.isLocalTest && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#F5EAD4] dark:bg-[#352712] text-[#765216] dark:text-[#E5C185]">
                            local test
                          </span>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-2xs ${
                          isCurrentUser
                            ? 'bg-[#103F39] text-white rounded-tr-none'
                            : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] rounded-tl-none border border-[#D9E2DA] dark:border-[#3A5146]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Attachments if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/20 dark:border-[#3A5146] space-y-1.5">
                            <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                              Attached Field Documents ({msg.attachments.length})
                            </span>
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                className={`flex items-center justify-between p-2 rounded-lg text-[11px] font-mono ${
                                  isCurrentUser
                                    ? 'bg-[#274A38] text-white'
                                    : 'bg-white dark:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                  <span className="truncate">{att.name}</span>
                                  <span className="opacity-60 text-[10px]">({att.size})</span>
                                </div>
                                <span className="opacity-70 text-[10px]">Ready</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Composer & File Staging Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-3 sm:p-4 border-t border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] transition-colors ${
                  isDragOver ? 'bg-[#EAF0E9] border-[#235F56]' : ''
                }`}
              >
                {/* Staged File Previews */}
                {stagedFiles.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#566159] dark:text-[#B5C1B5]">
                      <span className="font-semibold">Staged Attachments ({stagedFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setStagedFiles([])}
                        className="text-[10px] text-[#9D473D] hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stagedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#1A2B25] dark:text-[#72C6AD]" />
                          <span className="max-w-[140px] truncate text-[11px] text-[#1A2B25] dark:text-[#F2F4E9]">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-[#77827A] font-mono">
                            ({(file.size / (1024 * 1024)).toFixed(1)}M)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedFile(idx)}
                            className="p-0.5 text-[#77827A] hover:text-[#9D473D]"
                            title="Remove file"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Inputs */}
                <form onSubmit={handleSendReply} className="space-y-2">
                  <div className="flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.txt"
                    />

                    {/* Attachment Trigger Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#566159] dark:text-[#B5C1B5] hover:text-[#1A2B25] hover:bg-[#EAF0E9] transition-colors cursor-pointer shrink-0"
                      title="Attach field reports, photos, lift tickets or CSVs"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Textarea */}
                    <div className="flex-1 relative">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
                          }
                        }}
                        placeholder={`Message ${activeConversation.counterpartName}... (Press Enter to send, Shift+Enter for new line)`}
                        className="w-full p-2.5 text-xs bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#77827A] focus:outline-none focus:ring-1 focus:ring-[#006B61] dark:focus:ring-[#72C6AD] resize-none"
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!replyText.trim() && stagedFiles.length === 0}
                      className="px-4 py-2.5 rounded-lg bg-[#103F39] hover:bg-[#274A38] dark:bg-[#72C6AD] dark:hover:bg-[#96B681] text-white dark:text-[#0B2822] text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#77827A]">
                    <span className="hidden sm:inline">
                      Drag files into this area or click attachment icon (PDF, XLSX, JPG up to 15MB)
                    </span>
                    <span className="ml-auto font-mono text-[10px]">
                      Session Prototype • No remote packet dispatch
                    </span>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#566159] dark:text-[#B5C1B5] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#77827A]" />
              <p>Select a conversation from the list to view message history and send replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
