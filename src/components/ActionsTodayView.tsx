import React, { useState, useMemo } from 'react';
import {
  CalendarCheck2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Phone,
  MessageSquare,
  MapPin,
  Tag,
  ArrowRight,
  Edit2,
  Check,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Lead, PipelineStage, ALL_STAGES } from '../types/lead';
import { useLeadContext } from '../context/LeadContext';
import {
  formatDueDateLabel,
  formatReadableDate,
  formatWhatsAppUrl,
  getTodayDateString,
  getUrgencyStatus,
  isLeadCompletedOnDate,
  offsetDateString,
  parseDateString,
  STAGE_PROGRESSION,
} from '../utils/dateUtils';
import { ScheduleCallModal } from './ScheduleCallModal';
import { ReturnToPipelineModal } from './ReturnToPipelineModal';

type ActionSubFilter = 'due_today' | 'overdue' | 'upcoming' | 'completed';

interface ActionsTodayViewProps {
  onEditLead: (lead: Lead) => void;
  onOpenAddModal: () => void;
}

const STAGE_PRIORITY: Record<PipelineStage, number> = {
  'Call on Custom Date': 1,
  Trial: 2,
  'Second Trial': 3,
  'First Follow-up': 4,
  'Second Follow-up': 5,
  'Third Follow-up': 6,
  'Fourth Follow-up': 7,
  'Fifth Follow-up': 8,
  'Sixth Follow-up': 9,
  Inquired: 10,
  Completed: 11,
  Converted: 12,
  Redundant: 13,
};

export const ActionsTodayView: React.FC<ActionsTodayViewProps> = ({
  onEditLead,
  onOpenAddModal,
}) => {
  const {
    leads,
    markActionDone,
    rescheduleLead,
    changeStage,
    advanceToNextStage,
  } = useLeadContext();

  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [subFilter, setSubFilter] = useState<ActionSubFilter>('due_today');
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [returnLead, setReturnLead] = useState<Lead | null>(null);

  const isViewingToday = selectedDate === todayStr;
  const referenceDate = useMemo(() => parseDateString(selectedDate), [selectedDate]);
  const shortSelectedDate = useMemo(() => {
    const d = parseDateString(selectedDate);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [selectedDate]);

  // Day-specific buckets strictly computed for selectedDate
  const dayBuckets = useMemo(() => {
    const dueToday: Lead[] = [];
    const overdue: Lead[] = [];
    const upcoming: Lead[] = [];
    const completed: Lead[] = [];

    leads.forEach((lead) => {
      const isTerminal = lead.stage === 'Converted' || lead.stage === 'Redundant';
      const completedOnDay = isLeadCompletedOnDate(lead, selectedDate);

      if (completedOnDay) {
        completed.push(lead);
      }

      if (!isTerminal) {
        const urgency = getUrgencyStatus(lead.actionDueDate, referenceDate);
        if (urgency === 'today' && !completedOnDay) {
          dueToday.push(lead);
        } else if (urgency === 'overdue' && !completedOnDay) {
          overdue.push(lead);
        } else if (urgency === 'upcoming') {
          upcoming.push(lead);
        }
      }
    });

    // Sort Due for Today by stage priority, then name
    dueToday.sort((a, b) => {
      const pDiff = (STAGE_PRIORITY[a.stage] ?? 99) - (STAGE_PRIORITY[b.stage] ?? 99);
      return pDiff !== 0 ? pDiff : a.name.localeCompare(b.name);
    });

    // Sort Overdue oldest overdue first, then stage priority
    overdue.sort((a, b) => {
      const dDiff = a.actionDueDate.localeCompare(b.actionDueDate);
      if (dDiff !== 0) return dDiff;
      return (STAGE_PRIORITY[a.stage] ?? 99) - (STAGE_PRIORITY[b.stage] ?? 99);
    });

    // Sort Upcoming soonest first, then stage priority
    upcoming.sort((a, b) => {
      const dDiff = a.actionDueDate.localeCompare(b.actionDueDate);
      if (dDiff !== 0) return dDiff;
      return (STAGE_PRIORITY[a.stage] ?? 99) - (STAGE_PRIORITY[b.stage] ?? 99);
    });

    // Sort Completed most recently completed first
    completed.sort((a, b) => {
      const aTime = a.completedAt || a.updatedAt || '';
      const bTime = b.completedAt || b.updatedAt || '';
      return bTime.localeCompare(aTime);
    });

    return { dueToday, overdue, upcoming, completed };
  }, [leads, selectedDate, referenceDate]);

  const filteredActionLeads = useMemo(() => {
    switch (subFilter) {
      case 'due_today':
        return dayBuckets.dueToday;
      case 'overdue':
        return dayBuckets.overdue;
      case 'upcoming':
        return dayBuckets.upcoming;
      case 'completed':
        return dayBuckets.completed;
    }
  }, [dayBuckets, subFilter]);

  const getStageBadgeClass = (stage: PipelineStage) => {
    switch (stage) {
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Inquired':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Trial':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'First Follow-up':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Second Follow-up':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Second Trial':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Third Follow-up':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Fourth Follow-up':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'Fifth Follow-up':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'Sixth Follow-up':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'Call on Custom Date':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Converted':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Redundant':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatCompletedTime = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Option B: Specific-Day Date Selector Header Bar */}
      <div className="bg-[#0f1b35] border border-white/[0.08] rounded-2xl p-3 sm:px-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white">
                {formatReadableDate(selectedDate)}
              </h2>
              {isViewingToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Today
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Day Snapshot
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Showing Due, Overdue, Upcoming, and Completed actions specifically for {isViewingToday ? 'today' : shortSelectedDate}.
            </p>
          </div>
        </div>

        {/* Date Navigation Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedDate(offsetDateString(selectedDate, -1))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#090f1d] hover:bg-[#18274b] text-slate-200 border border-white/[0.08] transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 text-white cursor-pointer"
            title="Pick a specific date"
          />

          <button
            type="button"
            onClick={() => setSelectedDate(offsetDateString(selectedDate, 1))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#090f1d] hover:bg-[#18274b] text-slate-200 border border-white/[0.08] transition-colors cursor-pointer"
            title="Next Day"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {!isViewingToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
              title="Jump back to Today"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Action KPI Chips Strip (Each opens its own dedicated tab) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Due for Today Chip */}
        <button
          onClick={() => setSubFilter('due_today')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'due_today'
              ? 'bg-[#1b233a] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-amber-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
              {isViewingToday ? 'Due Today' : `Due ${shortSelectedDate}`}
            </span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {dayBuckets.dueToday.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </button>

        {/* Overdue Chip */}
        <button
          onClick={() => setSubFilter('overdue')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'overdue'
              ? 'bg-[#221727] border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-rose-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/80">
              Overdue
            </span>
            <div className="text-xl font-bold font-mono text-rose-400">
              {dayBuckets.overdue.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>

        {/* Upcoming Chip */}
        <button
          onClick={() => setSubFilter('upcoming')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'upcoming'
              ? 'bg-[#132347] border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-blue-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/80">
              Upcoming
            </span>
            <div className="text-xl font-bold font-mono text-blue-400">
              {dayBuckets.upcoming.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* Completed Chip */}
        <button
          onClick={() => setSubFilter('completed')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'completed'
              ? 'bg-[#0f2824] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-emerald-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
              Completed
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {dayBuckets.completed.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* 4 Distinct Sub-filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0f1b35] p-2 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSubFilter('due_today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'due_today'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {isViewingToday ? 'Due for Today' : `Due on ${shortSelectedDate}`} ({dayBuckets.dueToday.length})
          </button>

          <button
            onClick={() => setSubFilter('overdue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'overdue'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Overdue ({dayBuckets.overdue.length})
          </button>

          <button
            onClick={() => setSubFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'upcoming'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Upcoming ({dayBuckets.upcoming.length})
          </button>

          <button
            onClick={() => setSubFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'completed'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Completed ({dayBuckets.completed.length})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block pr-2">
          {filteredActionLeads.length} {filteredActionLeads.length === 1 ? 'lead' : 'leads'}
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-3">
        {filteredActionLeads.length === 0 ? (
          <div className="p-12 text-center bg-[#0f1b35] border border-white/[0.08] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              {subFilter === 'due_today'
                ? `No Actions Due ${isViewingToday ? 'Today' : `on ${shortSelectedDate}`}`
                : subFilter === 'overdue'
                ? `No Overdue Actions as of ${isViewingToday ? 'Today' : shortSelectedDate}`
                : subFilter === 'completed'
                ? `No Actions Completed ${isViewingToday ? 'Today' : `on ${shortSelectedDate}`}`
                : `No Upcoming Actions After ${isViewingToday ? 'Today' : shortSelectedDate}`}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {subFilter === 'due_today'
                ? 'All scheduled follow-ups for this day are clear. Check Overdue or Upcoming for other items.'
                : subFilter === 'overdue'
                ? 'Zero missed deadlines prior to this date.'
                : subFilter === 'completed'
                ? 'Actions completed on this exact day will appear here automatically and reset the next day.'
                : 'Add a lead or advance an existing stage to schedule future follow-ups.'}
            </p>
            {leads.length === 0 && (
              <button
                onClick={onOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                + Add Your First Lead
              </button>
            )}
          </div>
        ) : (
          filteredActionLeads.map((lead) => {
            const urgency = formatDueDateLabel(lead.actionDueDate, referenceDate);
            const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);
            const completedOnSelectedDay = isLeadCompletedOnDate(lead, selectedDate);
            const completedTimeStr = formatCompletedTime(lead.completedAt);

            return (
              <div
                key={lead.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-[#0f1b35] hover:bg-[#122040] shadow-lg ${
                  subFilter === 'completed'
                    ? 'border-emerald-500/35'
                    : urgency.status === 'overdue'
                    ? 'border-rose-500/30 hover:border-rose-500/50'
                    : urgency.status === 'today'
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-white/[0.08] hover:border-blue-500/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Client Details Box & Badges */}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    {/* Client Name, Phone, and Direct WhatsApp Business Button */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        {lead.name}
                        {completedOnSelectedDay && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Done {isViewingToday ? 'Today' : shortSelectedDate}
                            {completedTimeStr ? ` • ${completedTimeStr}` : ''}
                          </span>
                        )}
                      </h4>

                      {/* Phone call link */}
                      <a
                        href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090f1d] border border-white/[0.08] text-xs font-mono text-slate-300 hover:text-blue-400 transition-colors"
                        title="Click to call via telephone"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.phone}</span>
                      </a>

                      {/* DEDICATED GREEN WHATSAPP BUSINESS BUTTON */}
                      <a
                        href={waUrl}
                        target={typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) ? undefined : '_blank'}
                        rel={typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) ? undefined : 'noopener noreferrer'}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform active:scale-95"
                        title="Open directly in WhatsApp Business"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>WA Business</span>
                      </a>

                      {/* Urgency Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          urgency.status === 'overdue'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : urgency.status === 'today'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}
                      >
                        {urgency.text} • {urgency.subtext}
                      </span>
                    </div>

                    {/* Metadata Badges: Venue, Source, Stage, Outreach Sequence */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.06] text-xs">
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{lead.venue}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">
                        <Tag className="w-3 h-3" />
                        <span>{lead.leadSource}</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getStageBadgeClass(
                          lead.stage
                        )}`}
                      >
                        {lead.stage}
                      </span>

                      {(lead.stage === 'Inquired' || lead.stage === 'Completed' || lead.outreachStep) && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {(!lead.outreachStep || lead.outreachStep === 1) && 'Follow-up 1/3 (+3d)'}
                          {lead.outreachStep === 2 && 'Follow-up 2/3 (+2d)'}
                          {lead.outreachStep === 3 && 'Follow-up 3/3 (+2d)'}
                          {lead.outreachStep === 4 && 'Follow-ups Executed • Awaiting Manual Redundant'}
                        </span>
                      )}
                    </div>

                    {/* Completed Log Banner when completed on the selected day */}
                    {completedOnSelectedDay && lead.lastCompletedAction && (
                      <div className="px-3 py-2 rounded-xl bg-emerald-950/35 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          <span className="font-semibold text-emerald-300">
                            Completed {isViewingToday ? 'Today' : `on ${shortSelectedDate}`}:
                          </span>{' '}
                          {lead.lastCompletedAction}
                        </span>
                      </div>
                    )}

                    {/* Highlighted Action Note Box */}
                    <div className="p-3 rounded-xl bg-[#090f1d] border border-blue-500/20 text-xs text-slate-200 leading-relaxed shadow-inner">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Next Follow-up Action
                      </div>
                      <p className="font-medium text-slate-100">{lead.nextActionNote}</p>
                    </div>
                  </div>

                  {/* Right Column: Quick Action Controls */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-3 lg:pt-0 lg:pl-4">
                    {/* Mark Done & Workflow Progression Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => markActionDone(lead.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          completedOnSelectedDay
                            ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                        }`}
                        title="Mark current follow-up action done"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {(lead.stage === 'Inquired' || lead.stage === 'Completed') &&
                          (!lead.outreachStep || lead.outreachStep === 1)
                            ? 'Follow-up 1 Done (+2d)'
                            : (lead.stage === 'Inquired' || lead.stage === 'Completed') &&
                              lead.outreachStep === 2
                            ? 'Follow-up 2 Done (+2d)'
                            : (lead.stage === 'Inquired' || lead.stage === 'Completed') &&
                              lead.outreachStep === 3
                            ? 'Execute 3rd Follow-up'
                            : lead.stage === 'Trial'
                            ? 'Trial Done ➔ 1st Follow-up (+1d)'
                            : lead.stage === 'First Follow-up'
                            ? '1st Follow-up Done ➔ 2nd Follow-up (+2d)'
                            : lead.stage === 'Second Follow-up'
                            ? '2nd Follow-up Done (+2d wait)'
                            : lead.stage === 'Second Trial'
                            ? '2nd Trial Done ➔ 3rd Follow-up (+1d)'
                            : lead.stage === 'Third Follow-up'
                            ? '3rd Follow-up Done ➔ 4th Follow-up (+1d)'
                            : lead.stage === 'Fourth Follow-up'
                            ? '4th Follow-up Done (+2d wait)'
                            : lead.stage === 'Call on Custom Date'
                            ? 'Call Done ➔ Follow-up 1 (+3d)'
                            : lead.stage === 'Fifth Follow-up'
                            ? 'Follow-up 1 Done ➔ Follow-up 2 (+2d)'
                            : lead.stage === 'Sixth Follow-up'
                            ? 'Follow-up 2 Done (+2d wait)'
                            : completedOnSelectedDay
                            ? 'Done'
                            : 'Mark Done'}
                        </span>
                      </button>

                      {/* Manual Redundant Action Button for leads at end of sequences */}
                      {(lead.outreachStep === 4 ||
                        lead.stage === 'Second Follow-up' ||
                        lead.stage === 'Fourth Follow-up' ||
                        lead.stage === 'Sixth Follow-up') && (
                        <button
                          onClick={() => changeStage(lead.id, 'Redundant')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 shadow-sm transition-all cursor-pointer"
                          title="Manually push lead to Redundant stage"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
                          <span>Mark Redundant (Manual)</span>
                        </button>
                      )}

                      {/* 1-Click Advance to Next Enforced Stage */}
                      {lead.stage === 'Call on Custom Date' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setReturnLead(lead)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                            title="Call completed: Add client back to pipeline"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Return to Pipeline</span>
                          </button>
                          <button
                            onClick={() => changeStage(lead.id, 'Fifth Follow-up')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                            title="Missed or no response on call: Advance to Follow-up 1 (+3d)"
                          >
                            <span>No Response (+3d)</span>
                          </button>
                          {urgency.status === 'overdue' && (
                            <button
                              onClick={() => rescheduleLead(lead.id, 1)}
                              className="px-2 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Missed call: Rollover to next day (+1d)"
                            >
                              +1d Missed
                            </button>
                          )}
                        </div>
                      ) : (
                        STAGE_PROGRESSION[lead.stage]?.nextStage &&
                        lead.stage !== 'Second Follow-up' &&
                        lead.stage !== 'Fourth Follow-up' &&
                        lead.stage !== 'Sixth Follow-up' && (
                          <button
                            onClick={() => advanceToNextStage(lead.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400/50 shadow-sm transition-all cursor-pointer"
                            title={`Advance to ${STAGE_PROGRESSION[lead.stage].nextStage} (${STAGE_PROGRESSION[lead.stage].intervalText})`}
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                            <span>
                              Advance: {STAGE_PROGRESSION[lead.stage].nextStage} (
                              {STAGE_PROGRESSION[lead.stage].intervalText})
                            </span>
                          </button>
                        )
                      )}
                    </div>

                    {/* Reschedule Shortcuts */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => rescheduleLead(lead.id, 1)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#18274b] hover:bg-[#203666] text-slate-200 border border-white/[0.08] transition-colors cursor-pointer"
                        title="Reschedule deadline by +1 Day"
                      >
                        +1 Day
                      </button>
                      <button
                        onClick={() => rescheduleLead(lead.id, 3)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#18274b] hover:bg-[#203666] text-slate-200 border border-white/[0.08] transition-colors cursor-pointer"
                        title="Reschedule deadline by +3 Days"
                      >
                        +3 Days
                      </button>
                      <button
                        onClick={() => setSchedulingLead(lead)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Set exact custom date client requested to be called"
                      >
                        <Calendar className="w-3 h-3 text-violet-400" />
                        <span>Custom Call Date</span>
                      </button>
                    </div>

                    {/* Direct Stage Advance Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={lead.stage}
                        onChange={(e) => {
                          const newStage = e.target.value as PipelineStage;
                          if (newStage === 'Call on Custom Date') {
                            setSchedulingLead(lead);
                          } else {
                            changeStage(lead.id, newStage);
                          }
                        }}
                        className="text-xs py-1.5 px-2 bg-[#18274b] border border-white/[0.08] text-slate-200 rounded-xl focus:border-blue-500 cursor-pointer"
                      >
                        {ALL_STAGES.map((s) => (
                          <option key={s} value={s}>
                            Stage: {s}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => onEditLead(lead)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                        title="Edit Full Lead Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Custom Call Modal */}
      <ScheduleCallModal
        isOpen={!!schedulingLead}
        onClose={() => setSchedulingLead(null)}
        lead={schedulingLead}
        onConfirm={async (customDate, customNote) => {
          if (schedulingLead) {
            await changeStage(schedulingLead.id, 'Call on Custom Date', {
              actionDueDate: customDate,
              nextActionNote: customNote,
            });
          }
        }}
      />

      {/* Return to Pipeline Modal for Call on Custom Date leads */}
      <ReturnToPipelineModal
        isOpen={!!returnLead}
        onClose={() => setReturnLead(null)}
        lead={returnLead}
        onConfirm={async (targetStage, callOutcomeNote) => {
          if (returnLead) {
            await changeStage(returnLead.id, targetStage, {
              nextActionNote: callOutcomeNote,
            });
          }
        }}
      />
    </div>
  );
};
