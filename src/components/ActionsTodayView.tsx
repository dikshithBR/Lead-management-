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
  PlusCircle,
  RotateCw,
  Edit2,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Lead, PipelineStage, ALL_STAGES } from '../types/lead';
import { useLeadContext } from '../context/LeadContext';
import { formatDueDateLabel, formatWhatsAppUrl } from '../utils/dateUtils';
import { ScheduleCallModal } from './ScheduleCallModal';

type ActionSubFilter = 'due_or_overdue' | 'upcoming' | 'completed_today';

interface ActionsTodayViewProps {
  onEditLead: (lead: Lead) => void;
  onOpenAddModal: () => void;
}

export const ActionsTodayView: React.FC<ActionsTodayViewProps> = ({
  onEditLead,
  onOpenAddModal,
}) => {
  const {
    leads,
    kpiStats,
    markActionDone,
    rescheduleLead,
    changeStage,
  } = useLeadContext();

  const [subFilter, setSubFilter] = useState<ActionSubFilter>('due_or_overdue');
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);

  const filteredActionLeads = useMemo(() => {
    return leads.filter((lead) => {
      const urgency = formatDueDateLabel(lead.actionDueDate);

      if (subFilter === 'completed_today') {
        return lead.isCompletedToday === true;
      }

      if (subFilter === 'due_or_overdue') {
        // Exclude those already marked completed today, show overdue or today
        return (
          (urgency.status === 'overdue' || urgency.status === 'today') &&
          !lead.isCompletedToday
        );
      }

      if (subFilter === 'upcoming') {
        return urgency.status === 'upcoming' && !lead.isCompletedToday;
      }

      return true;
    });
  }, [leads, subFilter]);

  const getStageBadgeClass = (stage: PipelineStage) => {
    switch (stage) {
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
      case 'Call on Custom Date':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'Converted':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Redundant':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Action KPI Chips Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Due Today Chip */}
        <button
          onClick={() => setSubFilter('due_or_overdue')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'due_or_overdue'
              ? 'bg-[#1b233a] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-amber-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Due Today</span>
            <div className="text-xl font-bold font-mono text-amber-400">{kpiStats.dueTodayCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </button>

        {/* Overdue Chip */}
        <button
          onClick={() => setSubFilter('due_or_overdue')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'due_or_overdue' && kpiStats.overdueCount > 0
              ? 'bg-[#221727] border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-rose-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/80">Overdue</span>
            <div className="text-xl font-bold font-mono text-rose-400">{kpiStats.overdueCount}</div>
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/80">Upcoming</span>
            <div className="text-xl font-bold font-mono text-blue-400">{kpiStats.upcomingCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* Completed Today Chip */}
        <button
          onClick={() => setSubFilter('completed_today')}
          className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between ${
            subFilter === 'completed_today'
              ? 'bg-[#0f2824] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
              : 'bg-[#0f1b35] border-white/[0.08] hover:border-emerald-500/30'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">Completed</span>
            <div className="text-xl font-bold font-mono text-emerald-400">{kpiStats.completedTodayCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Sub-filters Navigation */}
      <div className="flex items-center justify-between bg-[#0f1b35] p-2 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubFilter('due_or_overdue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'due_or_overdue'
                ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-white border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Due Today & Overdue ({kpiStats.dueTodayOrOverdueCount})
          </button>

          <button
            onClick={() => setSubFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'upcoming'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Upcoming Follow-ups ({kpiStats.upcomingCount})
          </button>

          <button
            onClick={() => setSubFilter('completed_today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'completed_today'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Completed Today ({kpiStats.completedTodayCount})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block pr-2">
          {filteredActionLeads.length} items to action
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-3">
        {filteredActionLeads.length === 0 ? (
          <div className="p-12 text-center bg-[#0f1b35] border border-white/[0.08] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">All Caught Up!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {subFilter === 'due_or_overdue'
                ? 'No overdue or due-today tasks remaining. You are fully on top of client follow-ups!'
                : subFilter === 'completed_today'
                ? 'No follow-up tasks marked as done today yet. Check Due Today to start taking action!'
                : 'No upcoming tasks scheduled.'}
            </p>
          </div>
        ) : (
          filteredActionLeads.map((lead) => {
            const urgency = formatDueDateLabel(lead.actionDueDate);
            const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);

            return (
              <div
                key={lead.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-[#0f1b35] hover:bg-[#122040] shadow-lg ${
                  lead.isCompletedToday
                    ? 'border-emerald-500/30 opacity-75'
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
                    
                    {/* Client Name, Phone, and Direct WhatsApp Button */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        {lead.name}
                        {lead.isCompletedToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Completed
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

                      {/* DEDICATED GREEN WHATSAPP BUTTON (Prompt Requirement) */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 cursor-pointer"
                        title="Redirect directly to WhatsApp with pre-filled greeting"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>WhatsApp</span>
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

                    {/* Metadata Badges: Venue, Source, Stage */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.06] text-xs">
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{lead.venue}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">
                        <Tag className="w-3 h-3" />
                        <span>{lead.leadSource}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getStageBadgeClass(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </div>

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
                    
                    {/* Mark Done Button */}
                    <button
                      onClick={() => markActionDone(lead.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        lead.isCompletedToday
                          ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lead.isCompletedToday ? 'Done' : 'Mark Done'}</span>
                    </button>

                    {/* Reschedule Shortcuts */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => rescheduleLead(lead.id, 1)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#18274b] hover:bg-[#203666] text-slate-200 border border-white/[0.08] transition-colors"
                        title="Reschedule deadline by +1 Day"
                      >
                        +1 Day
                      </button>
                      <button
                        onClick={() => rescheduleLead(lead.id, 3)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#18274b] hover:bg-[#203666] text-slate-200 border border-white/[0.08] transition-colors"
                        title="Reschedule deadline by +3 Days"
                      >
                        +3 Days
                      </button>
                      <button
                        onClick={() => setSchedulingLead(lead)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 transition-colors flex items-center gap-1"
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
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/[0.04] rounded-lg transition-colors"
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
    </div>
  );
};
