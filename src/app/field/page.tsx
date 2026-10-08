'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { DataTable } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { projectService } from '../../lib/api/projectService';
import { MOCK_EXECUTION_EVENTS } from '../../lib/api/mockData';
import { ExecutionEvent, ColumnDef } from '../../types';
import {
  FileText,
  Upload,
  Mic,
  Send,
  Layers,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function FieldPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  const [events, setEvents] = useState<ExecutionEvent[]>(MOCK_EXECUTION_EVENTS);
  const [activeTab, setActiveTab] = useState<'quick' | 'dpr' | 'voice' | 'spreadsheet'>('quick');
  const [fieldInput, setFieldInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const breadcrumbs = [
    { label: 'Field Execution' },
    { label: 'Data Capture & Entity Extraction', current: true },
  ];

  const handleSampleFill = (text: string) => {
    setFieldInput(text);
  };

  const handleIngest = async () => {
    if (!fieldInput.trim()) {
      addToast({
        type: 'warning',
        title: 'Input Required',
        description: 'Please enter site update text or select a realistic sample.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sourceMap = {
        quick: 'FIELD_QUICK_FORM' as const,
        dpr: 'DPR_PDF' as const,
        voice: 'VOICE_AGENT' as const,
        spreadsheet: 'EXCEL_SHEET' as const,
      };

      const res = await projectService.submitFieldReport(
        activeProject.id,
        fieldInput,
        sourceMap[activeTab]
      );

      setEvents([res.data, ...events]);
      setFieldInput('');
      addToast({
        type: 'success',
        title: 'Field Update Extracted & Linked',
        description: `Matched to ${res.data.matchedActivityId || 'Queue'} with ${res.data.confidence}% (${res.data.confidence >= 90 ? 'High Confidence' : res.data.confidence >= 70 ? 'Review Required' : 'Unmatched'}).`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<ExecutionEvent>[] = [
    {
      id: 'id',
      header: 'Event ID',
      accessorKey: 'id',
      width: '120px',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded">
          {row.id}
        </span>
      ),
    },
    {
      id: 'rawText',
      header: 'Raw Field Statement',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-[#172033] leading-snug">{row.rawText}</p>
          <div className="flex items-center gap-2 text-[11px] text-[#596579] font-mono mt-1">
            <span>Source: {row.source}</span>
            <span>•</span>
            <span>{row.eventDate} {row.eventTime}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'extracted',
      header: 'Extracted Entity Fields',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5 font-mono">
          <div>
            <strong className="text-[#172033]">{row.discipline}</strong>
            <span className="text-[#596579]"> • {row.extractedFields.workType}</span>
          </div>
          <div className="text-[#596579]">
            Qty: <strong className="text-[#172033]">{row.quantity} {row.unit}</strong> • {row.area}
          </div>
        </div>
      ),
    },
    {
      id: 'matchedActivity',
      header: 'L5/L6 Candidate Target',
      cell: ({ row }) => (
        <div>
          {row.matchedActivityId ? (
            <>
              <span className="font-mono text-xs font-bold text-[#176B87]">
                {row.matchedActivityId}
              </span>
              <p className="text-[11px] text-[#596579] truncate">{row.matchedActivityName}</p>
            </>
          ) : (
            <span className="text-xs text-[#7B8798] italic">Unmatched (Routed to Review)</span>
          )}
        </div>
      ),
    },
    {
      id: 'confidence',
      header: 'Confidence Score',
      width: '140px',
      cell: ({ row }) => <ConfidenceBadge score={row.confidence} size="sm" />,
    },
    {
      id: 'status',
      header: 'Review Status',
      width: '140px',
      cell: ({ row }) => <StatusBadge status={row.status} type="event" size="sm" />,
    },
  ];

  const filteredEvents = events.filter(
    (e) =>
      e.rawText.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      (e.matchedActivityName && e.matchedActivityName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Field Data Ingestion & Entity Extraction Layer"
        description="Converts unstructured DPR reports, site diaries, Excel logs, and supervisor voice updates into structured execution events (Activity, Quantity, Area, Date) with confidence scoring."
        stage="FIELD"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/field/capture"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#176B87]" />
              <span>Field Capture</span>
            </Link>
            <Link
              href="/field/dpr"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>DPR / Time Agent</span>
            </Link>
          </div>
        }
        metadata={
          <>
            <span className="font-mono">INGESTION CHANNELS: 4 Active</span>
            <span>•</span>
            <span>EXTRACTION MODEL: Rule & Semantic Parser v2.4</span>
            <span>•</span>
            <span>SITE: Unit A Gas Processing</span>
          </>
        }
      />

      <StateWrapper
        loadingMessage="Loading field operations..."
        emptyTitle="No field activities assigned in this view"
        emptyDescription="Activities assigned to your discipline crew for today will appear here for status reporting. Check your assigned package or reset filters to view all tasks."
      >
        {/* Ingestion Console */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
          {/* Method Tabs */}
          <div className="flex border-b border-[#D9DEE5] bg-[#F7F8FA] overflow-x-auto">
            {[
              { id: 'quick', label: 'One-Click Quick Field Update', icon: Send },
              { id: 'dpr', label: 'Daily Progress Report (DPR PDF)', icon: FileText },
              { id: 'voice', label: 'Supervisor Voice / Conversational Agent', icon: Mic },
              { id: 'spreadsheet', label: 'CSV / Excel Site Log Sheet', icon: FileSpreadsheet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#176B87] text-[#176B87] bg-white'
                    : 'border-transparent text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Field Statement / Site Diary Extract
                </label>
                <div className="flex items-center gap-2 text-xs text-[#596579]">
                  <span className="text-[11px]">Load Sample:</span>
                  <button
                    onClick={() =>
                      handleSampleFill(
                        'Line 24-XX spool erection completed today. 12 spools erected with crane at Area Unit A.'
                      )
                    }
                    className="text-[11px] text-[#176B87] hover:underline"
                  >
                    [Piping Erection]
                  </button>
                  <button
                    onClick={() =>
                      handleSampleFill(
                        'Line 24 spool welding completed 8 joints today at Unit A header.'
                      )
                    }
                    className="text-[11px] text-[#176B87] hover:underline"
                  >
                    [Welding]
                  </button>
                  <button
                    onClick={() =>
                      handleSampleFill(
                        'Cable ladder tray installation done 45 meters from substation to compressor bay.'
                      )
                    }
                    className="text-[11px] text-[#176B87] hover:underline"
                  >
                    [Cable Tray]
                  </button>
                </div>
              </div>

              <textarea
                value={fieldInput}
                onChange={(e) => setFieldInput(e.target.value)}
                placeholder={
                  activeTab === 'voice'
                    ? "Transcribe or type voice audio note: e.g., 'Supervisor: Line 24 spool erection finished at 4:30 today with 12 spools done.'"
                    : activeTab === 'dpr'
                    ? "Paste text from Daily Progress Report or drop PDF text: e.g., 'Area: Unit A, Discipline: Piping. Line 24-XX spool erection completed. Work started at 09:00 and finished at 16:30.'"
                    : "Enter site execution update (discipline, activity description, quantities, area, line)..."
                }
                rows={3}
                className="w-full p-3 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-md focus:border-[#176B87] focus:bg-white text-[#172033] outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-[#596579] font-mono">
                Extraction Pipeline: <strong>Discipline</strong> → <strong>Asset Tag</strong> → <strong>Action</strong> → <strong>Quantity</strong>
              </div>

              <button
                onClick={handleIngest}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSubmitting ? 'Extracting & Matching...' : 'Process Field Update & Match Activity'}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Ingested Events Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              Captured Field Execution Events ({filteredEvents.length})
            </h3>
            <Link
              href="/matching"
              className="text-xs text-[#176B87] hover:underline font-medium inline-flex items-center gap-1"
            >
              Open Planner Review Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Filter captured field events by text, ID, or activity..."
            totalResults={filteredEvents.length}
          />

          <DataTable
            data={filteredEvents}
            columns={columns}
            keyExtractor={(row) => row.id}
          />
        </div>
      </StateWrapper>
    </div>
  );
}
