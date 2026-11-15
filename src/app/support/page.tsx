'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { verifyHoneypot, verifyRateLimit } from '../../lib/validation/formProtection';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { TestimonialsSection } from '../../components/shared/TestimonialsSection';
import {
  HelpCircle,
  Send,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Paperclip,
  Trash2,
  ExternalLink,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Info,
  X,
  FolderKanban,
  User,
  Mail,
  Layers,
  ArrowRight,
  Shield,
  LifeBuoy,
  FileQuestion,
  History,
  CornerDownRight,
} from 'lucide-react';

export type SupportUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface SupportDraftItem {
  id: string;
  timestamp: string;
  formattedDate: string;
  topic: string;
  urgency: SupportUrgency;
  projectCode: string;
  activityId?: string;
  subject: string;
  description: string;
  replyEmail: string;
  senderName: string;
  attachedFileNames: string[];
  statusLabel: 'Draft prepared';
}

interface FAQItem {
  id: string;
  category: 'Baselines & Schedule' | 'Field DPR & Evidence' | 'Matching Engine' | 'Offline & Sync' | 'Accounts & Access';
  question: string;
  shortAnswer: string;
  detailAnswer: string;
  relatedLink?: { label: string; href: string };
  keywords: string[];
}

const FAQ_KNOWLEDGE_BASE: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Field DPR & Evidence',
    question: 'How do I log and submit a DPR when working offline without internet?',
    shortAnswer: 'PLnEX saves DPRs to local browser IndexedDB cache. Submit normally and sync once online.',
    detailAnswer:
      'When disconnected, the application operates in Offline Mode automatically. All form drafts, entered quantities, and photos are safely written to your device’s local IndexedDB cache. You can click "Save DPR Locally to Offline Queue". Once you re-enter Wi-Fi or cellular coverage, open the Offline / Sync page (/sync) or click the sync indicator in the header to push pending uploads to the central Schedule Twin.',
    relatedLink: { label: 'Go to Offline / Sync Center', href: '/sync' },
    keywords: ['offline', 'dpr', 'sync', 'cache', 'indexeddb', 'internet', 'connection', 'local'],
  },
  {
    id: 'faq-2',
    category: 'Baselines & Schedule',
    question: 'What is the exact difference between "Forecast Late" and "Delayed" statuses?',
    shortAnswer: '"Forecast Late" means finish date is still in the future; "Delayed" means baseline finish is already breached.',
    detailAnswer:
      'To prevent premature delay panic, PLnEX distinguishes between two timeline conditions:\n• Forecast Late (Amber badge): The activity’s planned finish date has not yet passed at the current reporting Data Date, but its observed burn rate indicates it will finish past baseline.\n• Delayed (Red badge): The activity’s planned finish date has strictly elapsed and the work remains unfinished, causing critical path slippage.\nActivities finished past schedule are labeled "Completed Late".',
    relatedLink: { label: 'Inspect Schedule Activities', href: '/schedule' },
    keywords: ['forecast late', 'delayed', 'status', 'finish date', 'baseline', 'slip', 'completed late'],
  },
  {
    id: 'faq-3',
    category: 'Matching Engine',
    question: 'How does the auto-matching engine map unstructured field notes to WBS activities?',
    shortAnswer: 'PLnEX evaluates four weighted semantic signals: Discipline, Asset ID, Action Verb, and Schedule Window.',
    detailAnswer:
      'Execution events extracted from site diaries, WhatsApp transcripts, and DPRs are scored across four primary signals:\n1. Discipline Alignment (max 25 pts)\n2. Line / Asset / Spool Identifier (max 35 pts)\n3. Semantic Action Verb Alignment (max 20 pts)\n4. Scheduled Activity Window (max 20 pts)\nScores >= 90% auto-link; scores between 70% and 89% enter the Manager Review Queue; items < 70% remain Unmatched until manually mapped.',
    relatedLink: { label: 'Open Review Queue', href: '/review' },
    keywords: ['match', 'confidence', 'auto-link', 'unmatched', 'signals', 'score', 'algorithm', 'review queue'],
  },
  {
    id: 'faq-4',
    category: 'Baselines & Schedule',
    question: 'Does running a What-If simulation permanently modify the master Primavera P6 XML baseline?',
    shortAnswer: 'No. What-If calculations run inside an isolated deterministic sandbox in browser memory.',
    detailAnswer:
      'All forward-pass calculations in the What-If sandbox (/what-if) operate purely on a cloned memory instance of the CPM schedule graph. Adjusting activity delays, crew accelerations, or calendar constraints shows projected COD shifts without writing back to Primavera P6, Microsoft Project, or the enterprise database. Scenarios can be saved to your local session or exported as reports.',
    relatedLink: { label: 'Try What-If Simulator', href: '/what-if' },
    keywords: ['what-if', 'simulation', 'sandbox', 'p6', 'baseline', 'xml', 'permanent', 'cpm'],
  },
  {
    id: 'faq-5',
    category: 'Baselines & Schedule',
    question: 'What does "0 Days Total Float" mean for an in-progress pipeline activity?',
    shortAnswer: 'Total float is exhausted; any additional delay directly pushes the project Commercial Operation Date (COD).',
    detailAnswer:
      'Total Float represents the allowable delay an activity can absorb without delaying final completion. When float reaches 0, the activity joins the Critical Path (CPM Chain). In PLnEX, zero-float activities with negative variance trigger high-priority alerts in "What Needs My Attention" to authorize mitigation shifts before downstream milestones slip.',
    relatedLink: { label: 'View Delay & Dependency Impact', href: '/risks' },
    keywords: ['float', 'total float', 'critical path', 'cpm', 'cod', 'buffer', 'zero float'],
  },
  {
    id: 'faq-6',
    category: 'Field DPR & Evidence',
    question: 'Why does physical progress sign-off require photographic or lab compression certificates?',
    shortAnswer: 'Physical progress requires audited field evidence to ensure bankable Schedule Twin verification.',
    detailAnswer:
      'Under EPC project controls standards (AACE RP 37R-06), physical progress cannot be credited solely on unverified narrative claims. For civil foundation pours, lab compression cube break sheets (e.g. 28-day 35 MPa) or surveyor geotagged photos are attached as immutable proof tickets before physical progress is synchronized to the baseline curve.',
    relatedLink: { label: 'Browse Evidence & Audit Ledger', href: '/evidence' },
    keywords: ['evidence', 'sign-off', 'photo', 'cube test', 'dpr', 'audit', 'proof', 'verification'],
  },
  {
    id: 'faq-7',
    category: 'Offline & Sync',
    question: 'How do I resolve a sync conflict between field observations and schedule baseline data?',
    shortAnswer: 'Inspect the conflict in the Review Queue (/review) to confirm or reassign the candidate activity.',
    detailAnswer:
      'If two supervisors report overlapping spool quantities or a field code matches multiple successor activities, PLnEX places the event in the Manager Review Queue with an amber badge. The project controls manager can inspect the raw DPR snippet, review alternative candidate activities, and assign the true target with one click.',
    relatedLink: { label: 'Go to Matching & Disambiguation', href: '/matching' },
    keywords: ['conflict', 'sync', 'disambiguation', 'review', 'duplicate', 'overlap'],
  },
  {
    id: 'faq-8',
    category: 'Accounts & Access',
    question: 'How do I switch appearance between Light Theme, Dark Theme, or Follow System?',
    shortAnswer: 'Click the Sun/Moon icon in the top header or select Light / Dark / Auto in the user menu.',
    detailAnswer:
      'PLnEX provides high-contrast Light and Dark palettes designed according to WCAG 2.2 AA contrast standards (>= 4.5:1). You can toggle between them instantly with the sun/moon icon in the top navigation bar, or select your preference (including "Follow System") inside the User Profile Menu or Display Settings modal.',
    keywords: ['theme', 'dark mode', 'light mode', 'contrast', 'system', 'appearance', 'display'],
  },
];

const SUPPORT_STORAGE_KEY = 'plnex_support_history';
const SUPPORT_DEST_EMAIL = 'kumarsinghaljatin@gmail.com';

export default function SupportPage() {
  const { userSession, activeProject, allProjects } = useApp();
  const { addToast } = useToast();
  const router = useRouter();
  const formMountTime = useRef(Date.now());
  const [honeypot, setHoneypot] = useState('');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'request' | 'faq' | 'history'>('request');

  // Request Form Fields
  const [topic, setTopic] = useState('Field DPR & Quantity Verification');
  const [urgency, setUrgency] = useState<SupportUrgency>('medium');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProject?.id || 'PRJ-OIL-2026-01');
  const [activityId, setActivityId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyEmail, setReplyEmail] = useState(userSession?.email || 'manager@oilindia.in');
  const [senderName, setSenderName] = useState(userSession?.name || 'Rajesh Sharma');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Local draft submission feedback state
  const [lastDraftPrepared, setLastDraftPrepared] = useState<SupportDraftItem | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Local Storage Drafts History
  const [localHistory, setLocalHistory] = useState<SupportDraftItem[]>([]);

  // FAQ Search & Category Filter
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  // Guided Chat Simulator State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; link?: { label: string; href: string }; timestamp: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am the PLnEX Help Assistant (Offline Knowledge Guide). How can I assist you today? You can select a quick question below or search our documentation.',
      timestamp: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load local draft history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUPPORT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalHistory(parsed);
        }
      }
    } catch {
      // LocalStorage access exception fallback
    }
  }, []);

  // Update defaults when userSession loads
  useEffect(() => {
    if (userSession?.email && !replyEmail) {
      setReplyEmail(userSession.email);
    }
    if (userSession?.name && !senderName) {
      setSenderName(userSession.name);
    }
  }, [userSession]);

  // Selected project object
  const currentProject = useMemo(() => {
    return allProjects.find((p) => p.id === selectedProjectId) || activeProject;
  }, [allProjects, selectedProjectId, activeProject]);

  // Handle Drag & Drop files
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      addFilesToList(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      addFilesToList(newFiles);
    }
  };

  const addFilesToList = (files: File[]) => {
    // Check 15MB limit and acceptable extensions
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.log', '.txt'];
    const valid: File[] = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        addToast({
          type: 'warning',
          title: 'Unsupported File Type',
          description: `${file.name} is not supported. Use PDF, Images, Spreadsheets, or Logs.`,
        });
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        addToast({
          type: 'warning',
          title: 'File Exceeds Size Limit',
          description: `${file.name} is larger than 15 MB.`,
        });
        continue;
      }
      valid.push(file);
    }

    setAttachedFiles((prev) => [...prev, ...valid]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Structured Email Draft Payload Formatter
  const constructDraftBody = () => {
    const projCode = currentProject?.code || 'OIL-DUL-01';
    const projName = currentProject?.name || 'Duliajan Gas Processing';
    const fileListStr = attachedFiles.length > 0
      ? attachedFiles.map((f, i) => `  ${i + 1}. ${f.name} (${Math.round(f.size / 1024)} KB)`).join('\n')
      : '  (None attached in web form)';

    return [
      `=== PLnEX PROJECT CONTROLS SUPPORT REQUEST ===`,
      ``,
      `PROJECT CONTEXT:`,
      `• Project: ${projName} [${projCode}]`,
      `• Related Activity / WBS: ${activityId ? activityId.trim() : 'N/A'}`,
      `• Topic Category: ${topic}`,
      `• Urgency Level: ${urgency.toUpperCase()}`,
      ``,
      `SENDER DETAILS:`,
      `• Name: ${senderName || 'Not specified'}`,
      `• Official Email: ${replyEmail || 'Not specified'}`,
      `• Session Persona: ${userSession?.role || 'manager'} (${userSession?.organization || 'Oil India Limited'})`,
      `• Timestamp: ${new Date().toISOString()}`,
      `• Web Application Version: PLnEX v1.0.0 (Rev 3.2 Schedule Twin Engine)`,
      ``,
      `PROBLEM DESCRIPTION & DIAGNOSTIC DETAILS:`,
      description.trim(),
      ``,
      `ATTACHMENT INVENTORY (Please attach manually in your mail client):`,
      fileListStr,
      ``,
      `==============================================`,
      `Note: This email was prepared via the PLnEX Help & Support portal on ${new Date().toLocaleDateString('en-GB')}.`,
    ].join('\n');
  };

  const constructEmailSubject = () => {
    const projCode = currentProject?.code || 'OIL-DUL-01';
    return `[PLnEX Support - ${urgency.toUpperCase()}] ${subject.trim()} (${projCode})`;
  };

  // Form Validation & Prepare Draft Action
  const handlePrepareEmailDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!subject.trim()) {
      errors.subject = 'Please enter a brief subject line for your request.';
    }
    if (!description.trim()) {
      errors.description = 'Please describe the issue or question in detail.';
    } else if (description.trim().length < 15) {
      errors.description = 'Please provide a bit more detail (minimum 15 characters) to help diagnose the issue.';
    }
    if (!replyEmail.trim() || !replyEmail.includes('@')) {
      errors.replyEmail = 'Please provide a valid reply email address.';
    }

    // 1. Honeypot check (reject automated bots silently)
    if (!verifyHoneypot(honeypot)) {
      addToast({
        type: 'error',
        title: 'Submission Blocked',
        description: 'Automated spam bot detection triggered.',
      });
      return;
    }

    // 2. Rate limiting check (time-gate + frequency)
    const rateCheck = verifyRateLimit('support_inquiry', formMountTime.current);
    if (!rateCheck.allowed) {
      addToast({
        type: 'warning',
        title: 'Submission Rate Exceeded',
        description: rateCheck.errorMessage || 'Please wait a moment before sending another request.',
      });
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast({
        type: 'warning',
        title: 'Missing Required Information',
        description: 'Please complete the highlighted fields before preparing the email draft.',
      });
      return;
    }

    setFormErrors({});

    const emailSubject = constructEmailSubject();
    const emailBody = constructDraftBody();

    // Construct Mailto URL
    const mailtoUrl = `mailto:${encodeURIComponent(SUPPORT_DEST_EMAIL)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    // Create Draft Record for Local Browser History
    const newDraft: SupportDraftItem = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      topic,
      urgency,
      projectCode: currentProject?.code || 'OIL-DUL-01',
      activityId: activityId.trim() || undefined,
      subject: subject.trim(),
      description: description.trim(),
      replyEmail: replyEmail.trim(),
      senderName: senderName.trim(),
      attachedFileNames: attachedFiles.map((f) => f.name),
      statusLabel: 'Draft prepared',
    };

    // Save to LocalStorage
    const updatedHistory = [newDraft, ...localHistory.slice(0, 19)];
    setLocalHistory(updatedHistory);
    try {
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch {
      // Ignore localStorage exceptions
    }

    setLastDraftPrepared(newDraft);

    // Open default mail client
    try {
      window.location.href = mailtoUrl;
    } catch {
      // Fallback if browser blocks protocol handler
    }

    addToast({
      type: 'info',
      title: 'Email Draft Prepared',
      description: `Draft created for ${SUPPORT_DEST_EMAIL}. Redirecting to confirmation page...`,
    });

    // Navigate to dedicated Thank You confirmation page
    setTimeout(() => {
      router.push('/thank-you');
    }, 400);
  };

  // Copy structured summary to clipboard fallback
  const handleCopySummary = () => {
    const emailSubject = constructEmailSubject();
    const emailBody = constructDraftBody();
    const fullText = `Subject: ${emailSubject}\nTo: ${SUPPORT_DEST_EMAIL}\n\n${emailBody}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedSummary(true);
      addToast({
        type: 'success',
        title: 'Summary Copied to Clipboard',
        description: 'You can paste this structured request into Gmail, Outlook, or any webmail composer.',
      });
      setTimeout(() => setCopiedSummary(false), 3000);
    });
  };

  // Clear local history handler
  const handleClearHistory = () => {
    if (confirm('Clear local support request history from this browser? This cannot be undone.')) {
      setLocalHistory([]);
      try {
        localStorage.removeItem(SUPPORT_STORAGE_KEY);
      } catch {
        // Ignore
      }
      addToast({
        type: 'info',
        title: 'History Cleared',
        description: 'Local draft history removed from browser storage.',
      });
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = localHistory.filter((item) => item.id !== id);
    setLocalHistory(updated);
    try {
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQ_KNOWLEDGE_BASE.filter((faq) => {
      if (faqCategory !== 'ALL' && faq.category !== faqCategory) {
        return false;
      }
      if (faqSearch.trim()) {
        const query = faqSearch.toLowerCase().trim();
        const matchesQuestion = faq.question.toLowerCase().includes(query);
        const matchesShort = faq.shortAnswer.toLowerCase().includes(query);
        const matchesDetail = faq.detailAnswer.toLowerCase().includes(query);
        const matchesKeywords = faq.keywords.some((k) => k.toLowerCase().includes(query));
        return matchesQuestion || matchesShort || matchesDetail || matchesKeywords;
      }
      return true;
    });
  }, [faqCategory, faqSearch]);

  // Guided Assistant Simulator
  const handleSendChatMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    // Scripted FAQ keyword search simulation
    setTimeout(() => {
      const qLower = query.toLowerCase();
      const match = FAQ_KNOWLEDGE_BASE.find(
        (f) =>
          f.question.toLowerCase().includes(qLower) ||
          f.keywords.some((k) => qLower.includes(k)) ||
          f.shortAnswer.toLowerCase().includes(qLower)
      );

      let botReply = '';
      let botLink: { label: string; href: string } | undefined;

      if (match) {
        botReply = `${match.shortAnswer}\n\n${match.detailAnswer}`;
        botLink = match.relatedLink;
      } else {
        botReply =
          'I searched the verified PLnEX FAQ guide but did not find an exact match for your question. You can submit a structured support request to our engineering team using the "Submit Request" tab.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot' as const,
          text: botReply,
          link: botLink,
          timestamp: 'Just now',
        },
      ]);

      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const breadcrumbs = [
    { label: 'System' },
    { label: 'Help & Support', current: true },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero Header with Deliberate Navy Anchor in Light Mode */}
      <div className="bg-[#103F39] text-[#F2F4E9] dark:bg-[#17221D] border border-[#235F56] dark:border-[#3A5146] rounded-xl p-5 sm:p-7 shadow-md transition-colors relative overflow-hidden">
        {/* Subtle background accent glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#006B61]/15 dark:bg-[#72C6AD]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]">
                <LifeBuoy className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#72C6AD] dark:text-[#72C6AD]">
                PLnEX Support Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-white">
              Help, Documentation & Support
            </h1>
            <p className="text-xs sm:text-sm text-[#B5C1B5] leading-relaxed">
              Find answers to common project controls questions, inspect offline sync and CPM baseline guidelines, or prepare a formal support email draft.
            </p>
          </div>

          {/* Direct Support Contact Badge */}
          <div className="bg-[#101815] border border-[#3A5146] rounded-lg p-3.5 space-y-1 self-start md:self-auto text-xs shrink-0">
            <span className="text-[10px] uppercase font-bold text-[#B5C1B5] block tracking-wider">
              Official Support Channel
            </span>
            <div className="flex items-center gap-2 font-mono text-white text-xs font-semibold">
              <Mail className="w-3.5 h-3.5 text-[#72C6AD]" />
              <a href={`mailto:${SUPPORT_DEST_EMAIL}`} className="hover:text-[#72C6AD] transition-colors underline">
                {SUPPORT_DEST_EMAIL}
              </a>
            </div>
            <span className="text-[10px] text-[#B5C1B5] block">
              Direct engineering review • Weekdays 08:00–18:00 IST
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'request'
                ? 'bg-[#006B61] text-white shadow-xs'
                : 'text-[#B5C1B5] hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Request</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-[#006B61] text-white shadow-xs'
                : 'text-[#B5C1B5] hover:text-white hover:bg-white/5'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>FAQs & Guided Assistant</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white">
              {FAQ_KNOWLEDGE_BASE.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#006B61] text-white shadow-xs'
                : 'text-[#B5C1B5] hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Local Draft History</span>
            {localHistory.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white">
                {localHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: SUBMIT NEW SUPPORT REQUEST (Clear form with email draft generator)
          ========================================================================= */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form Column (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
              <div className="border-b border-[#D9E2DA] dark:border-[#3A5146] pb-3.5">
                <h2 className="text-lg font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9]">
                  New Support Request
                </h2>
                <p className="text-xs text-[#596A7D] dark:text-[#B5C1B5] mt-0.5">
                  Prepares an email draft to <strong className="font-mono text-[#006B61] dark:text-[#72C6AD]">{SUPPORT_DEST_EMAIL}</strong> with structured project diagnostics.
                </p>
              </div>

              {/* Feedback Alert when a draft was just generated */}
              {lastDraftPrepared && (
                <div className="p-4 rounded-lg bg-[#E4F5EC] dark:bg-[#153629] border border-[#BCE7D2] dark:border-[#1C5247] text-xs text-[#1F6B4D] dark:text-[#67D49A] space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Email Draft Created in Your Local Mail Client</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    A draft addressed to <strong>{SUPPORT_DEST_EMAIL}</strong> has been prepared with your request parameters. If your email app did not launch automatically, you can use the copy button below to paste into Gmail or Outlook.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 rounded bg-white dark:bg-[#17221D] border border-[#BCE7D2] dark:border-[#1C5247] text-xs font-semibold text-[#1F6B4D] dark:text-[#67D49A] hover:bg-[#F6F7F3] dark:hover:bg-[#101815] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#1F6B4D]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSummary ? 'Copied!' : 'Copy Summary to Clipboard'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastDraftPrepared(null)}
                      className="text-[11px] underline text-[#596A7D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handlePrepareEmailDraft} className="space-y-4 text-xs">
                {/* Anti-Spam Honeypot Field (Concealed from humans, filled by bots) */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <label htmlFor="website_url">Website URL (leave empty)</label>
                  <input
                    id="website_url"
                    type="text"
                    name="website_url"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                {/* Row 1: Topic & Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Topic */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                      Topic / Category <span className="text-[#A43E47]">*</span>
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] transition-colors cursor-pointer"
                    >
                      <option value="Field DPR & Quantity Verification">Field DPR & Quantity Verification</option>
                      <option value="Baseline Schedule & P6/MSP Import">Baseline Schedule & P6/MSP Import</option>
                      <option value="Match Confidence & Auto-Linking Rules">Match Confidence & Auto-Linking Rules</option>
                      <option value="Delay & Dependency Impact Analysis">Delay & Dependency Impact Analysis</option>
                      <option value="What-If Scenario Sandbox">What-If Scenario Sandbox</option>
                      <option value="Offline Mode & Local Storage Sync">Offline Mode & Local Storage Sync</option>
                      <option value="User Roles, Permissions & Access">User Roles, Permissions & Access</option>
                      <option value="Bug Report / UI Glitch">Bug Report / UI Glitch</option>
                      <option value="General Inquiry / Feedback">General Inquiry / Feedback</option>
                    </select>
                  </div>

                  {/* Urgency */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                      Urgency Level <span className="text-[#A43E47]">*</span>
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as SupportUrgency)}
                      className="w-full p-2.5 bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] transition-colors cursor-pointer"
                    >
                      <option value="low">Low — General question or documentation inquiry</option>
                      <option value="medium">Medium — Workflow inconvenience / non-blocking</option>
                      <option value="high">High — Shift execution or DPR submission blocked</option>
                      <option value="critical">Critical — Site execution hold / milestone COD risk</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Project & Related Activity ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                      Associated Project <span className="text-[#A43E47]">*</span>
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] transition-colors cursor-pointer"
                    >
                      {allProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related Activity ID (Optional) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] flex items-center justify-between">
                      <span>Related Activity / WBS ID</span>
                      <span className="text-[10px] text-[#596A7D] dark:text-[#B5C1B5] font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={activityId}
                      onChange={(e) => setActivityId(e.target.value)}
                      placeholder="e.g. PIP-24-002, CIV-11-001, or WBS 1.1.2"
                      className="w-full p-2.5 bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs font-mono text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#52665D] dark:placeholder-[#B5C1B5] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] transition-colors"
                    />
                  </div>
                </div>

                {/* Subject Line */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                    Subject Line <span className="text-[#A43E47]">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue or question..."
                    className={`w-full p-2.5 bg-white dark:bg-[#101815] border rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#52665D] dark:placeholder-[#B5C1B5] outline-hidden transition-colors ${
                      formErrors.subject
                        ? 'border-[#A43E47] focus:border-[#A43E47]'
                        : 'border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD]'
                    }`}
                  />
                  {formErrors.subject && (
                    <p className="text-[11px] text-[#A43E47] dark:text-[#FF9A9A] font-medium">{formErrors.subject}</p>
                  )}
                </div>

                {/* Problem Description with Diagnostic Guidance */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                      Problem Description & Symptoms <span className="text-[#A43E47]">*</span>
                    </label>
                    <span className="text-[10px] text-[#596A7D] dark:text-[#B5C1B5]">Min 15 characters</span>
                  </div>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details on the issue: What steps led to the problem? What error message or variance is shown? What was the expected behavior?"
                    className={`w-full p-3 bg-white dark:bg-[#101815] border rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#52665D] dark:placeholder-[#B5C1B5] outline-hidden transition-colors leading-relaxed ${
                      formErrors.description
                        ? 'border-[#A43E47] focus:border-[#A43E47]'
                        : 'border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD]'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="text-[11px] text-[#A43E47] dark:text-[#FF9A9A] font-medium">{formErrors.description}</p>
                  )}

                  {/* Diagnostic helper tips box */}
                  <div className="p-2.5 bg-[#EEF2F7] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[11px] text-[#596A7D] dark:text-[#B5C1B5] space-y-1">
                    <strong className="text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                      Tips for faster diagnosis:
                    </strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                      <li>Mention the exact activity code, spool ID, or DPR document reference if applicable.</li>
                      <li>Specify if the issue occurred while offline or during synchronization.</li>
                      <li>Include your browser and device type (e.g. Chrome on Windows, Chrome on Android).</li>
                    </ul>
                  </div>
                </div>

                {/* Row 3: Reply Email & Sender Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sender Name */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                      Your Name <span className="text-[#A43E47]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#596A7D] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Reply Email */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                      Reply Email Address <span className="text-[#A43E47]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#596A7D] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={replyEmail}
                        onChange={(e) => setReplyEmail(e.target.value)}
                        placeholder="you@organization.com"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#101815] border rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden transition-colors ${
                          formErrors.replyEmail
                            ? 'border-[#A43E47] focus:border-[#A43E47]'
                            : 'border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD]'
                        }`}
                      />
                    </div>
                    {formErrors.replyEmail && (
                      <p className="text-[11px] text-[#A43E47] dark:text-[#FF9A9A] font-medium">{formErrors.replyEmail}</p>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-2 pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                      <span>Optional File Attachments & Screenshots</span>
                    </label>
                    <span className="text-[10px] text-[#596A7D] dark:text-[#B5C1B5]">Max 15 MB total</span>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-xl p-5 text-center bg-[#F6F7F3]/50 dark:bg-[#101815]/30 cursor-pointer transition-colors space-y-1.5"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.log,.txt"
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-full bg-[#EEF2F7] dark:bg-[#101815] text-[#006B61] dark:text-[#72C6AD] flex items-center justify-center mx-auto">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                      Drag and drop logs, PDFs, or screenshots here, or{' '}
                      <span className="text-[#006B61] dark:text-[#72C6AD] underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-[#596A7D] dark:text-[#B5C1B5]">
                      Supported formats: PDF, PNG, JPG, CSV, XLSX, LOG, TXT (up to 15 MB)
                    </p>
                  </div>

                  {/* File List */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                        Selected files ({attachedFiles.length}):
                      </span>
                      <div className="space-y-1">
                        {attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#EEF2F7] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD] shrink-0" />
                              <span className="font-mono text-[#1A2B25] dark:text-[#F2F4E9] truncate">{file.name}</span>
                              <span className="text-[10px] text-[#596A7D] dark:text-[#B5C1B5] shrink-0">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              className="p-1 hover:text-[#A43E47] text-[#596A7D] dark:text-[#B5C1B5] transition-colors"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explicit Browser Mailto Attachment Limitation Callout */}
                  <div className="p-3 bg-[#FFF0D6] dark:bg-[#3B2F19] border border-[#FFD076] dark:border-[#5A4520] rounded-lg text-xs text-[#8B5600] dark:text-[#FFD076] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#8B5600] dark:text-[#FFD076]" />
                      <span>Important Notice Regarding Attachments:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      For browser security reasons, an email draft opened via a web link (<code className="font-mono">mailto:</code>) cannot automatically attach files from your local hard drive. <strong>Please manually attach the selected files in your email application</strong> once the draft opens.
                    </p>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 border-t border-[#D9E2DA] dark:border-[#3A5146] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-[#596A7D] dark:text-[#B5C1B5]">
                    Draft will be addressed to: <span className="font-mono font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">{SUPPORT_DEST_EMAIL}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] hover:bg-[#EEF2F7] dark:hover:bg-[#3A5146] transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Copy structured text for webmail"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#1F6B4D]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSummary ? 'Copied' : 'Copy Text'}</span>
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-[#006B61] hover:bg-[#0b5f59] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Prepare Email Draft →</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Information Column (1 col) */}
          <div className="space-y-5">
            {/* What Happens Next Card */}
            <div className="bg-[#EEF2F7] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-5 text-xs text-[#1A2B25] dark:text-[#F2F4E9] space-y-3">
              <div className="flex items-center gap-2 font-bold font-heading text-sm text-[#006B61] dark:text-[#72C6AD]">
                <Info className="w-4 h-4" />
                <span>How Support Works in PLnEX</span>
              </div>
              <ol className="list-decimal pl-4 space-y-2 text-[#596A7D] dark:text-[#B5C1B5] text-[11.5px] leading-relaxed">
                <li>
                  <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">Draft Generation:</strong> Clicking "Prepare Email Draft" opens your device’s default mail app (Outlook, Apple Mail, Thunderbird, etc.) pre-filled with technical details.
                </li>
                <li>
                  <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">Add Files & Send:</strong> Attach any screenshots or logs and click Send in your email program.
                </li>
                <li>
                  <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">Direct Resolution:</strong> Our engineering desk reviews the technical parameters and responds directly to your reply email address.
                </li>
              </ol>

              <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146]">
                <span className="text-[11px] text-[#596A7D] dark:text-[#B5C1B5] block">
                  Prefer webmail? Click <strong>"Copy Text"</strong> and paste into Gmail at{' '}
                  <span className="font-mono text-[#006B61] dark:text-[#72C6AD]">{SUPPORT_DEST_EMAIL}</span>.
                </span>
              </div>
            </div>

            {/* Quick FAQ Shortcuts Card */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-5 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold font-heading text-sm text-[#1A2B25] dark:text-[#F2F4E9]">
                  Quick Self-Service FAQs
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className="text-[11px] font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {FAQ_KNOWLEDGE_BASE.slice(0, 3).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('faq');
                      setExpandedFaqId(f.id);
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] bg-[#F6F7F3]/50 dark:bg-[#101815]/30 transition-colors cursor-pointer group"
                  >
                    <div className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] group-hover:text-[#006B61] dark:group-hover:text-[#72C6AD] transition-colors leading-snug">
                      {f.question}
                    </div>
                    <div className="text-[10px] text-[#596A7D] dark:text-[#B5C1B5] mt-1 line-clamp-1">
                      {f.shortAnswer}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SEARCHABLE FAQS & GUIDED ASSISTANT
          ========================================================================= */}
      {activeTab === 'faq' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Searchable FAQs (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Category Filter Header */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
              <div className="relative">
                <Search className="w-4 h-4 text-[#596A7D] dark:text-[#B5C1B5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search FAQ guides, CPM terms, offline sync, or match rules..."
                  className="w-full pl-9 pr-8 py-2.5 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#52665D] dark:placeholder-[#B5C1B5] outline-hidden focus:border-[#006B61] dark:focus:border-[#72C6AD] transition-colors"
                />
                {faqSearch && (
                  <button
                    type="button"
                    onClick={() => setFaqSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#596A7D] hover:text-[#1A2B25] dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  'ALL',
                  'Baselines & Schedule',
                  'Field DPR & Evidence',
                  'Matching Engine',
                  'Offline & Sync',
                  'Accounts & Access',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFaqCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      faqCategory === cat
                        ? 'bg-[#006B61] text-white shadow-2xs'
                        : 'bg-[#EEF2F7] dark:bg-[#101815] text-[#596A7D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-2.5">
              {filteredFaqs.length === 0 ? (
                <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-8 text-center space-y-2">
                  <HelpCircle className="w-8 h-8 text-[#596A7D] dark:text-[#B5C1B5] mx-auto" />
                  <p className="text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                    No FAQs match your search
                  </p>
                  <p className="text-xs text-[#596A7D] dark:text-[#B5C1B5] max-w-sm mx-auto">
                    Try searching for terms like "float", "DPR", "offline", or "matching", or submit an email inquiry.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqSearch('');
                      setFaqCategory('ALL');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#EEF2F7] dark:bg-[#101815] text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] mt-2 inline-flex items-center gap-1 cursor-pointer"
                  >
                    Reset Search Filters
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl overflow-hidden transition-colors shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-[#F6F7F3]/50 dark:hover:bg-[#101815]/40 transition-colors select-none cursor-pointer"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#EEF2F7] dark:bg-[#101815] text-[#006B61] dark:text-[#72C6AD]">
                              {faq.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">
                            {faq.question}
                          </h3>
                        </div>
                        <div className="p-1 rounded-md text-[#596A7D] dark:text-[#B5C1B5] shrink-0">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#D9E2DA]/70 dark:border-[#3A5146] text-xs text-[#596A7D] dark:text-[#B5C1B5] space-y-3 bg-[#F6F7F3]/30 dark:bg-[#101815]/20">
                          <p className="leading-relaxed whitespace-pre-line text-[#1A2B25] dark:text-[#F2F4E9]">
                            {faq.detailAnswer}
                          </p>

                          {faq.relatedLink && (
                            <div className="pt-2">
                              <Link
                                href={faq.relatedLink.href}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline"
                              >
                                <span>{faq.relatedLink.label}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Guided Chat Preview Panel (1 col) */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl shadow-xs overflow-hidden flex flex-col h-[560px] transition-colors">
              {/* Chat Header with Explicit Disclaimer */}
              <div className="p-3.5 bg-[#EEF2F7] dark:bg-[#101815] border-b border-[#D9E2DA] dark:border-[#3A5146] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#006B61] dark:bg-[#72C6AD] animate-pulse" />
                    <span className="font-bold font-heading text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
                      Interactive FAQ Assistant
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8EEFF] dark:bg-[#243832] text-[#2E55A3] dark:text-[#A8BEFF]">
                    Offline Preview
                  </span>
                </div>
                <p className="text-[10.5px] text-[#596A7D] dark:text-[#B5C1B5] leading-tight">
                  Scripted knowledge guide based on verified PLnEX documentation. Does not access external AI models or live databases.
                </p>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl leading-relaxed text-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#006B61] text-white rounded-br-none'
                          : 'bg-[#EEF2F7] dark:bg-[#101815] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded-bl-none whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                      {msg.link && (
                        <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                          <Link
                            href={msg.link.href}
                            className="font-bold text-[#006B61] dark:text-[#72C6AD] hover:underline inline-flex items-center gap-1"
                          >
                            <span>{msg.link.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-[#596A7D] dark:text-[#B5C1B5] mt-0.5 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 border-t border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3]/60 dark:bg-[#101815]/30 flex flex-wrap gap-1 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('How do I sync DPR when working offline?')}
                  className="px-2 py-1 rounded bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9] hover:border-[#006B61] transition-colors cursor-pointer"
                >
                  Offline sync?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('Why is an activity marked Forecast Late?')}
                  className="px-2 py-1 rounded bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9] hover:border-[#006B61] transition-colors cursor-pointer"
                >
                  Forecast Late?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('What does 0 days Total Float mean?')}
                  className="px-2 py-1 rounded bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9] hover:border-[#006B61] transition-colors cursor-pointer"
                >
                  Zero float?
                </button>
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="p-2.5 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center gap-2 bg-white dark:bg-[#17221D]"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about PLnEX..."
                  className="flex-1 p-2 text-xs bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] outline-hidden focus:border-[#006B61]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-lg bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] disabled:opacity-40 cursor-pointer"
                  title="Send question"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Need More Help Action */}
            <div className="p-4 rounded-xl bg-[#EEF2F7] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] text-xs text-center space-y-2">
              <p className="text-[#596A7D] dark:text-[#B5C1B5]">
                Couldn’t find the answer in our documentation?
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('request');
                  setSubject('Inquiry following documentation search');
                }}
                className="w-full py-2 px-3 rounded-lg bg-white dark:bg-[#17221D] border border-[#006B61] dark:border-[#72C6AD] text-[#006B61] dark:text-[#72C6AD] font-bold text-xs hover:bg-[#006B61] hover:text-white dark:hover:bg-[#72C6AD] dark:hover:text-[#0B2822] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open an Email Support Request &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PREVIOUS REQUESTS (Strictly local browser history)
          ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Explicit Local Storage Disclaimer */}
          <div className="p-4 rounded-xl bg-[#EEF2F7] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                <History className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                <span>Local Browser History (Frontend Only)</span>
              </div>
              <p className="text-[11px] text-[#596A7D] dark:text-[#B5C1B5] leading-relaxed max-w-3xl">
                The requests below were prepared as email drafts on this device. Because PLnEX operates frontend-only without an external ticketing database, these items represent your local session history. Requests are not synchronized or tracked on a central server.
              </p>
            </div>

            {localHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-lg border border-[#A43E47]/40 text-[#A43E47] dark:text-[#FF9A9A] hover:bg-[#FCE8EA] dark:hover:bg-[#3D2227] text-xs font-semibold self-start sm:self-auto transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Local History</span>
              </button>
            )}
          </div>

          {/* Drafts List */}
          {localHistory.length === 0 ? (
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#EEF2F7] dark:bg-[#101815] text-[#596A7D] dark:text-[#B5C1B5] flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9]">
                No support drafts prepared yet
              </h3>
              <p className="text-xs text-[#596A7D] dark:text-[#B5C1B5] max-w-sm mx-auto">
                When you prepare a support request draft, a copy of the diagnostic payload is saved in your browser history for reference.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('request')}
                className="px-4 py-2 rounded-lg bg-[#006B61] hover:bg-[#0b5f59] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Submit a Request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {localHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2DA]/60 dark:border-[#3A5146] pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#006B61] dark:text-[#72C6AD]">
                          {item.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E8EEFF] dark:bg-[#243832] text-[#2E55A3] dark:text-[#A8BEFF]">
                          {item.statusLabel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            item.urgency === 'critical'
                              ? 'bg-[#FCE8EA] text-[#A43E47] dark:bg-[#3D2227] dark:text-[#FF9A9A]'
                              : item.urgency === 'high'
                              ? 'bg-[#FFF0D6] text-[#8B5600] dark:bg-[#3B2F19] dark:text-[#FFD076]'
                              : 'bg-[#EEF2F7] text-[#596A7D] dark:bg-[#101815] dark:text-[#B5C1B5]'
                          }`}
                        >
                          Urgency: {item.urgency}
                        </span>
                        <span className="text-[11px] font-mono text-[#596A7D] dark:text-[#B5C1B5]">
                          Project: {item.projectCode}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9]">
                        {item.subject}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                      <span className="text-[11px] font-mono text-[#596A7D] dark:text-[#B5C1B5]">
                        {item.formattedDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1 text-[#596A7D] hover:text-[#A43E47] transition-colors"
                        title="Delete from local history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#596A7D] dark:text-[#B5C1B5] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-[#596A7D] dark:text-[#B5C1B5]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>Topic: <strong>{item.topic}</strong></span>
                      {item.activityId && (
                        <span>Activity: <strong className="font-mono">{item.activityId}</strong></span>
                      )}
                      <span>Reply To: <strong className="font-mono">{item.replyEmail}</strong></span>
                      {item.attachedFileNames.length > 0 && (
                        <span>Attached: <strong>{item.attachedFileNames.join(', ')}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const mailtoUrl = `mailto:${encodeURIComponent(SUPPORT_DEST_EMAIL)}?subject=${encodeURIComponent(
                            `[PLnEX Support - ${item.urgency.toUpperCase()}] ${item.subject} (${item.projectCode})`
                          )}&body=${encodeURIComponent(item.description)}`;
                          window.location.href = mailtoUrl;
                        }}
                        className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Re-open Mailto &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified Customer Reviews Section (Placeholders Only — Real Reviews To Be Added by Owner) */}
      <TestimonialsSection />
    </div>
  );
}
