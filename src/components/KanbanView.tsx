import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  MapPin,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  ArrowRight,
  GripVertical,
  Plus,
  Check,
  Filter,
  Columns,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { Lead, PipelineStage } from '../types/lead';
import { useLeadContext } from '../context/LeadContext';
import {
  formatDueDateLabel,
  formatWhatsAppUrl,
  getTodayDateString,
  offsetDateString,
} from '../utils/dateUtils';
import { ScheduleCallModal } from './ScheduleCallModal';
import { ReturnToPipelineModal } from './ReturnToPipelineModal';

interface KanbanViewProps {
  onEditLead: (lead: Lead) => void;
  onRequestDelete: (lead: Lead) => void;
  onOpenAddModalWithStage: (stage: PipelineStage) => void;
}

type MainKanbanColumnId =
  | 'Inquired'
  | 'Trial'
  | 'Second Trial'
  | 'Call on Custom Date'
  | 'Converted'
  | 'Redundant';

type BoardSelection = 'main' | 'all-boards' | MainKanbanColumnId;

interface SubStageConfig {
  id: string;
  label: string;
  shortLabel: string;
  targetStage: PipelineStage;
  outreachStep?: number;
  dotColor: string;
  accentClass: string;
  badgeClass: string;
  matches: (lead: Lead) => boolean;
}

interface MainColumnConfig {
  id: MainKanbanColumnId;
  title: string;
  boardTitle: string;
  description: string;
  accent: string;
  dot: string;
  subStages: SubStageConfig[];
  matchesLead: (lead: Lead) => boolean;
}

const MAIN_COLUMNS: MainColumnConfig[] = [
  {
    id: 'Inquired',
    title: 'Inquired',
    boardTitle: 'Inquired Follow-up Board',
    description: '3-step inquiry follow-up sequence (+3d, +2d, +2d) before manual Redundant',
    accent: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    dot: 'bg-blue-400',
    matchesLead: (l) => l.stage === 'Inquired' || l.stage === 'Completed',
    subStages: [
      {
        id: 'inquired-step-1',
        label: '1st Follow-up (+3d)',
        shortLabel: '1st Follow-up (+3d)',
        targetStage: 'Inquired',
        outreachStep: 1,
        dotColor: 'bg-blue-400',
        accentClass: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
        badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        matches: (l) =>
          (l.stage === 'Inquired' || l.stage === 'Completed') &&
          (!l.outreachStep || l.outreachStep === 1),
      },
      {
        id: 'inquired-step-2',
        label: '2nd Follow-up (+2d)',
        shortLabel: '2nd Follow-up (+2d)',
        targetStage: 'Inquired',
        outreachStep: 2,
        dotColor: 'bg-sky-400',
        accentClass: 'border-sky-500/30 text-sky-300 bg-sky-500/10',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        matches: (l) =>
          (l.stage === 'Inquired' || l.stage === 'Completed') && l.outreachStep === 2,
      },
      {
        id: 'inquired-step-3',
        label: '3rd Follow-up (+2d)',
        shortLabel: '3rd Follow-up (+2d)',
        targetStage: 'Inquired',
        outreachStep: 3,
        dotColor: 'bg-indigo-400',
        accentClass: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        matches: (l) =>
          (l.stage === 'Inquired' || l.stage === 'Completed') && l.outreachStep === 3,
      },
      {
        id: 'inquired-step-4',
        label: 'Awaiting Redundant',
        shortLabel: 'Awaiting Redundant',
        targetStage: 'Inquired',
        outreachStep: 4,
        dotColor: 'bg-rose-400',
        accentClass: 'border-rose-500/30 text-rose-300 bg-rose-500/10',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        matches: (l) =>
          (l.stage === 'Inquired' || l.stage === 'Completed') && l.outreachStep === 4,
      },
    ],
  },
  {
    id: 'Trial',
    title: 'Trial',
    boardTitle: '1st Trial Follow-up Board',
    description: '1st Trial session followed by 1st Follow-up (+1d) and 2nd Follow-up (+2d)',
    accent: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    dot: 'bg-cyan-400',
    matchesLead: (l) =>
      l.stage === 'Trial' ||
      l.stage === 'First Follow-up' ||
      l.stage === 'Second Follow-up',
    subStages: [
      {
        id: 'trial-main',
        label: '1st Trial Session',
        shortLabel: '1st Trial',
        targetStage: 'Trial',
        dotColor: 'bg-cyan-400',
        accentClass: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        matches: (l) => l.stage === 'Trial',
      },
      {
        id: 'trial-fu-1',
        label: '1st Follow-up (+1d)',
        shortLabel: '1st Follow-up (+1d)',
        targetStage: 'First Follow-up',
        dotColor: 'bg-indigo-400',
        accentClass: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        matches: (l) => l.stage === 'First Follow-up',
      },
      {
        id: 'trial-fu-2',
        label: '2nd Follow-up (+2d)',
        shortLabel: '2nd Follow-up (+2d)',
        targetStage: 'Second Follow-up',
        dotColor: 'bg-purple-400',
        accentClass: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        matches: (l) => l.stage === 'Second Follow-up',
      },
    ],
  },
  {
    id: 'Second Trial',
    title: '2nd Trial',
    boardTitle: '2nd Trial Follow-up Board',
    description: '2nd Trial session followed by 3rd Follow-up (+1d) and 4th Follow-up (+1d)',
    accent: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    dot: 'bg-amber-400',
    matchesLead: (l) =>
      l.stage === 'Second Trial' ||
      l.stage === 'Third Follow-up' ||
      l.stage === 'Fourth Follow-up',
    subStages: [
      {
        id: 'second-trial-main',
        label: '2nd Trial Session',
        shortLabel: '2nd Trial',
        targetStage: 'Second Trial',
        dotColor: 'bg-amber-400',
        accentClass: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        matches: (l) => l.stage === 'Second Trial',
      },
      {
        id: 'second-trial-fu-3',
        label: '3rd Follow-up (+1d)',
        shortLabel: '3rd Follow-up (+1d)',
        targetStage: 'Third Follow-up',
        dotColor: 'bg-teal-400',
        accentClass: 'border-teal-500/30 text-teal-300 bg-teal-500/10',
        badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        matches: (l) => l.stage === 'Third Follow-up',
      },
      {
        id: 'second-trial-fu-4',
        label: '4th Follow-up (+1d)',
        shortLabel: '4th Follow-up (+1d)',
        targetStage: 'Fourth Follow-up',
        dotColor: 'bg-sky-400',
        accentClass: 'border-sky-500/30 text-sky-300 bg-sky-500/10',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        matches: (l) => l.stage === 'Fourth Follow-up',
      },
    ],
  },
  {
    id: 'Call on Custom Date',
    title: 'Call on Custom',
    boardTitle: 'Call on Custom Date Board',
    description: 'Scheduled call date -> Follow-up 1 (+3d) -> Follow-up 2 (+2d) -> +2d wait before Redundant',
    accent: 'border-purple-500/40 text-purple-300 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    dot: 'bg-purple-400',
    matchesLead: (l) =>
      l.stage === 'Call on Custom Date' ||
      l.stage === 'Fifth Follow-up' ||
      l.stage === 'Sixth Follow-up',
    subStages: [
      {
        id: 'custom-call-main',
        label: 'Scheduled Call',
        shortLabel: 'Scheduled Call',
        targetStage: 'Call on Custom Date',
        dotColor: 'bg-purple-400',
        accentClass: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        matches: (l) => l.stage === 'Call on Custom Date',
      },
      {
        id: 'custom-call-fu-1',
        label: 'Follow-up 1 (+3d)',
        shortLabel: 'Follow-up 1 (+3d)',
        targetStage: 'Fifth Follow-up',
        dotColor: 'bg-orange-400',
        accentClass: 'border-orange-500/30 text-orange-300 bg-orange-500/10',
        badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        matches: (l) => l.stage === 'Fifth Follow-up',
      },
      {
        id: 'custom-call-fu-2',
        label: 'Follow-up 2 (+2d)',
        shortLabel: 'Follow-up 2 (+2d)',
        targetStage: 'Sixth Follow-up',
        dotColor: 'bg-violet-400',
        accentClass: 'border-violet-500/30 text-violet-300 bg-violet-500/10',
        badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        matches: (l) => l.stage === 'Sixth Follow-up',
      },
    ],
  },
  {
    id: 'Converted',
    title: 'Converted',
    boardTitle: 'Converted (Won) Board',
    description: 'Successfully converted & onboarded clients',
    accent: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    dot: 'bg-emerald-400',
    matchesLead: (l) => l.stage === 'Converted',
    subStages: [],
  },
  {
    id: 'Redundant',
    title: 'Redundant',
    boardTitle: 'Redundant Leads Board',
    description: 'Leads manually moved to Redundant after completing follow-up sequences',
    accent: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
    dot: 'bg-slate-400',
    matchesLead: (l) => l.stage === 'Redundant',
    subStages: [],
  },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  onEditLead,
  onRequestDelete,
  onOpenAddModalWithStage,
}) => {
  const { leads, changeStage, markActionDone } = useLeadContext();
  const [selectedBoard, setSelectedBoard] = useState<BoardSelection>('main');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [returnLead, setReturnLead] = useState<Lead | null>(null);

  // Per-column sub-stage filter for the Main Board
  const [mainSubFilters, setMainSubFilters] = useState<Record<string, string>>({});

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverTarget(null);
  };

  const handleDragOverTarget = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const moveLeadToSubStage = async (leadId: string, sub: SubStageConfig) => {
    const found = leads.find((l) => l.id === leadId);
    if (!found) return;

    if (sub.targetStage === 'Call on Custom Date') {
      setSchedulingLead(found);
      return;
    }

    if (sub.outreachStep !== undefined) {
      const today = getTodayDateString();
      const dueDate =
        sub.outreachStep === 2 || sub.outreachStep === 3
          ? offsetDateString(today, 2)
          : sub.outreachStep === 4
          ? today
          : offsetDateString(today, 3);
      const note =
        sub.outreachStep === 2
          ? '2nd Follow-up: Offer Trial Session'
          : sub.outreachStep === 3
          ? '3rd Follow-up: Send third trial offer'
          : sub.outreachStep === 4
          ? "3rd follow-up executed. Awaiting manual update to 'Redundant' stage."
          : '1st Follow-up Reminder: Initial check-in';
      await changeStage(leadId, 'Inquired', {
        outreachStep: sub.outreachStep,
        actionDueDate: dueDate,
        nextActionNote: note,
        isCompletedToday: false,
      });
      return;
    }

    await changeStage(leadId, sub.targetStage);
  };

  const handleDropOnMainColumn = async (e: React.DragEvent, col: MainColumnConfig) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      if (col.id === 'Call on Custom Date') {
        const found = leads.find((l) => l.id === leadId);
        if (found) {
          setSchedulingLead(found);
        } else {
          await changeStage(leadId, col.id);
        }
      } else if (col.id === 'Inquired') {
        await changeStage(leadId, 'Inquired', { outreachStep: 1 });
      } else {
        await changeStage(leadId, col.id);
      }
    }
    setDraggedLeadId(null);
    setDragOverTarget(null);
  };

  const handleDropOnSubStage = async (e: React.DragEvent, sub: SubStageConfig) => {
    e.preventDefault();
    e.stopPropagation();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      await moveLeadToSubStage(leadId, sub);
    }
    setDraggedLeadId(null);
    setDragOverTarget(null);
  };

  const getCardActionLabel = (lead: Lead): string | null => {
    if (lead.stage === 'Inquired' || lead.stage === 'Completed') {
      const step = lead.outreachStep ?? 1;
      if (step === 1) return 'Follow-up 1 Done (+2d)';
      if (step === 2) return 'Follow-up 2 Done (+2d)';
      if (step === 3) return 'Execute 3rd Follow-up';
      return null;
    }
    switch (lead.stage) {
      case 'Trial':
        return 'Trial Done (+1d)';
      case 'First Follow-up':
        return '1st Done (+2d)';
      case 'Second Follow-up':
        return '2nd Done (+2d wait)';
      case 'Second Trial':
        return '2nd Trial Done (+1d)';
      case 'Third Follow-up':
        return '3rd Done (+1d)';
      case 'Fourth Follow-up':
        return '4th Done (+2d wait)';
      case 'Call on Custom Date':
        return 'No Response (+3d)';
      case 'Fifth Follow-up':
        return 'Follow-up 1 Done (+2d)';
      case 'Sixth Follow-up':
        return 'Follow-up 2 Done (+2d wait)';
      default:
        return null;
    }
  };

  const getSubBadgeForLead = (lead: Lead): { label: string; badgeClass: string } | undefined => {
    for (const col of MAIN_COLUMNS) {
      for (const sub of col.subStages) {
        if (sub.matches(lead)) {
          return { label: sub.shortLabel, badgeClass: sub.badgeClass };
        }
      }
    }
    return undefined;
  };

  const renderLeadCard = (lead: Lead, isConverted: boolean, showSubBadge = true) => {
    const urgency = formatDueDateLabel(lead.actionDueDate);
    const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);
    const isDragging = draggedLeadId === lead.id;
    const actionLabel = getCardActionLabel(lead);
    const subBadge = showSubBadge ? getSubBadgeForLead(lead) : undefined;
    const showManualRedundant =
      (lead.stage === 'Inquired' && lead.outreachStep === 4) ||
      (lead.stage === 'Completed' && lead.outreachStep === 4) ||
      lead.stage === 'Second Follow-up' ||
      lead.stage === 'Fourth Follow-up' ||
      lead.stage === 'Sixth Follow-up';

    const currentSelectorValue =
      lead.stage === 'Inquired' || lead.stage === 'Completed'
        ? `Inquired::${lead.outreachStep ?? 1}`
        : lead.stage;

    return (
      <div
        key={lead.id}
        draggable
        onDragStart={(e) => handleDragStart(e, lead.id)}
        onDragEnd={handleDragEnd}
        className={`p-3 rounded-xl border bg-[#090f1d] hover:bg-[#111e3b] transition-all duration-150 cursor-grab active:cursor-grabbing shadow-md group ${
          isConverted
            ? 'border-emerald-500/30 hover:border-emerald-500/60'
            : 'border-white/[0.08] hover:border-blue-500/40'
        } ${isDragging ? 'opacity-40 scale-95' : ''}`}
      >
        {/* Card Top: Drag handle, Name & Sub-stage badge */}
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-slate-300" />
            <h4 className="text-xs font-bold text-white truncate">{lead.name}</h4>
          </div>
          {subBadge && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border shrink-0 ${subBadge.badgeClass}`}
            >
              {subBadge.label}
            </span>
          )}
        </div>

        {/* Phone & WhatsApp Quick Access */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
          <a
            href={`tel:${lead.phone.replace(/\s+/g, '')}`}
            className="hover:text-blue-400 flex items-center gap-1 truncate"
            title="Call"
          >
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </a>
          <a
            href={waUrl}
            target={typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) ? undefined : '_blank'}
            rel={typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) ? undefined : 'noopener noreferrer'}
            className="text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
            title="Open directly in WhatsApp Business"
          >
            <MessageSquare className="w-3 h-3 fill-current" />
            <span className="text-[9px] font-semibold">WA Business</span>
          </a>
        </div>

        {/* Venue & Source Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-slate-300 border border-white/[0.06] truncate max-w-full">
            <MapPin className="w-2.5 h-2.5 text-blue-400 shrink-0" />
            <span className="truncate">{lead.venue}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-full">
            <Tag className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{lead.leadSource}</span>
          </span>
        </div>

        {/* Next Action Note Preview */}
        <div className="p-2 rounded-lg bg-[#0f1b35] border border-white/[0.04] mb-2.5 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
          {lead.nextActionNote}
        </div>

        {/* Due Date Urgency & Card Controls */}
        <div className="space-y-2 pt-1.5 border-t border-white/[0.04]">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                urgency.status === 'overdue'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : urgency.status === 'today'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
              }`}
            >
              {urgency.text}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditLead(lead)}
                className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onRequestDelete(lead)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Grouped Sub-Stage Selector & Quick Action Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <select
              value={currentSelectorValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('Inquired::')) {
                  const step = parseInt(val.split('::')[1], 10);
                  const sub = MAIN_COLUMNS[0].subStages.find((s) => s.outreachStep === step);
                  if (sub) moveLeadToSubStage(lead.id, sub);
                } else {
                  const newStage = val as PipelineStage;
                  if (newStage === 'Call on Custom Date') {
                    setSchedulingLead(lead);
                  } else {
                    changeStage(lead.id, newStage);
                  }
                }
              }}
              className="flex-1 min-w-[115px] text-[10px] py-1 px-1.5 bg-[#18274b] border border-white/[0.08] text-slate-200 rounded-md focus:border-blue-500 cursor-pointer"
              title="Move to Stage / Sub-stage"
            >
              <optgroup label="Inquired">
                <option value="Inquired::1">Inquired ▸ 1st Follow-up (+3d)</option>
                <option value="Inquired::2">Inquired ▸ 2nd Follow-up (+2d)</option>
                <option value="Inquired::3">Inquired ▸ 3rd Follow-up (+2d)</option>
                <option value="Inquired::4">Inquired ▸ Awaiting Redundant</option>
              </optgroup>
              <optgroup label="1st Trial">
                <option value="Trial">Trial ▸ 1st Trial Session</option>
                <option value="First Follow-up">Trial ▸ 1st Follow-up (+1d)</option>
                <option value="Second Follow-up">Trial ▸ 2nd Follow-up (+2d)</option>
              </optgroup>
              <optgroup label="2nd Trial">
                <option value="Second Trial">2nd Trial ▸ 2nd Trial Session</option>
                <option value="Third Follow-up">2nd Trial ▸ 3rd Follow-up (+1d)</option>
                <option value="Fourth Follow-up">2nd Trial ▸ 4th Follow-up (+1d)</option>
              </optgroup>
              <optgroup label="Call on Custom">
                <option value="Call on Custom Date">Custom Call ▸ Scheduled Call</option>
                <option value="Fifth Follow-up">Custom Call ▸ Follow-up 1 (+3d)</option>
                <option value="Sixth Follow-up">Custom Call ▸ Follow-up 2 (+2d)</option>
              </optgroup>
              <optgroup label="Outcome">
                <option value="Converted">Converted</option>
                <option value="Redundant">Redundant</option>
              </optgroup>
            </select>

            {actionLabel && (
              <button
                onClick={() => markActionDone(lead.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                title="Mark current step done & schedule next follow-up"
              >
                <Check className="w-3 h-3" />
                <span>{actionLabel}</span>
              </button>
            )}

            {lead.stage === 'Call on Custom Date' && (
              <>
                <button
                  onClick={() => setReturnLead(lead)}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-600/25 text-blue-300 border border-blue-500/35 hover:bg-blue-600/40 transition-colors cursor-pointer"
                  title="Call finished: Add client back to pipeline"
                >
                  Pipeline ➔
                </button>
                <button
                  onClick={() => setSchedulingLead(lead)}
                  className="p-1 text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 rounded border border-violet-500/20 transition-colors cursor-pointer"
                  title="Reschedule Custom Call Date"
                >
                  <Calendar className="w-3 h-3" />
                </button>
              </>
            )}

            {showManualRedundant && (
              <button
                onClick={() => changeStage(lead.id, 'Redundant')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-rose-500/25 text-rose-300 border border-rose-500/35 hover:bg-rose-500/40 transition-colors cursor-pointer"
                title="Manually push lead to Redundant stage"
              >
                <ArrowRight className="w-3 h-3" />
                <span>Redundant</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renders a dedicated horizontal Kanban board for one main stage (its follow-ups as side-by-side columns)
  const renderDedicatedStageBoard = (col: MainColumnConfig) => {
    const boardLeads = leads.filter(col.matchesLead);
    const isConverted = col.id === 'Converted';
    const isRedundant = col.id === 'Redundant';

    return (
      <div
        key={`board-${col.id}`}
        className="rounded-2xl bg-[#0b142a]/80 border border-white/[0.08] p-4 space-y-3 shadow-xl"
      >
        {/* Board Title Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full shrink-0 ${col.dot}`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">{col.boardTitle}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${col.accent}`}
                >
                  {boardLeads.length} leads
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{col.description}</p>
            </div>
          </div>

          <button
            onClick={() => onOpenAddModalWithStage(col.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead to {col.title}</span>
          </button>
        </div>

        {/* Dedicated Board Columns */}
        {col.subStages.length > 0 ? (
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:flex gap-4 items-start">
              {col.subStages.map((sub) => {
                const subLeads = boardLeads.filter(sub.matches);
                const isTarget = dragOverTarget === `board-sub-${sub.id}`;

                return (
                  <div
                    key={sub.id}
                    onDragOver={(e) => handleDragOverTarget(e, `board-sub-${sub.id}`)}
                    onDragLeave={(e) => {
                      e.stopPropagation();
                      if (dragOverTarget === `board-sub-${sub.id}`) setDragOverTarget(null);
                    }}
                    onDrop={(e) => handleDropOnSubStage(e, sub)}
                    className={`w-full lg:w-[300px] lg:shrink-0 rounded-2xl border bg-[#0f1b35] flex flex-col transition-all ${
                      isTarget
                        ? 'ring-2 ring-blue-500/80 bg-blue-900/20 border-blue-400'
                        : 'border-white/[0.08]'
                    }`}
                  >
                    {/* Follow-up Column Header */}
                    <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sub.dotColor}`} />
                        <h4 className="text-xs font-bold text-white truncate">{sub.label}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${sub.badgeClass}`}
                      >
                        {subLeads.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="p-2.5 space-y-2.5 min-h-[260px]">
                      {subLeads.length === 0 ? (
                        <div className="h-28 border-2 border-dashed border-white/[0.05] rounded-xl flex items-center justify-center text-center p-3">
                          <p className="text-[11px] text-slate-500">Drop leads into {sub.shortLabel}</p>
                        </div>
                      ) : (
                        subLeads.map((lead) => renderLeadCard(lead, isConverted, false))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => handleDragOverTarget(e, `board-terminal-${col.id}`)}
            onDragLeave={() => {
              if (dragOverTarget === `board-terminal-${col.id}`) setDragOverTarget(null);
            }}
            onDrop={(e) => handleDropOnMainColumn(e, col)}
            className={`rounded-2xl border p-3 min-h-[220px] transition-colors ${
              isConverted
                ? 'bg-[#0b1d28]/70 border-emerald-500/30'
                : isRedundant
                ? 'bg-[#0e1626]/50 border-white/[0.05]'
                : 'bg-[#0f1b35] border-white/[0.08]'
            } ${dragOverTarget === `board-terminal-${col.id}` ? 'ring-2 ring-blue-500/80' : ''}`}
          >
            {boardLeads.length === 0 ? (
              <div className="h-36 border-2 border-dashed border-white/[0.05] rounded-xl flex items-center justify-center text-center p-4">
                <p className="text-xs text-slate-500">No leads in {col.title} yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {boardLeads.map((lead) => renderLeadCard(lead, isConverted, false))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Kanban Board Switcher Bar */}
      <div className="bg-[#0f1b35] border border-white/[0.08] rounded-2xl p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedBoard('main')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedBoard === 'main'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Main Board (6 Stages)</span>
          </button>

          <button
            onClick={() => setSelectedBoard('all-boards')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedBoard === 'all-boards'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Stage Boards</span>
          </button>

          <div className="h-5 w-px bg-white/[0.08] mx-1 hidden sm:block" />

          {MAIN_COLUMNS.map((col) => {
            const count = leads.filter(col.matchesLead).length;
            const isActive = selectedBoard === col.id;
            return (
              <button
                key={`tab-${col.id}`}
                onClick={() => setSelectedBoard(col.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? `${col.accent} ring-1 ring-white/20`
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                title={`Open dedicated Kanban board for ${col.title}`}
              >
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span>{col.title}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View 1: Main Kanban Board (6 Main Stages) */}
      {selectedBoard === 'main' && (
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-[1680px] items-start">
            {MAIN_COLUMNS.map((col) => {
              const allStageLeads = leads.filter(col.matchesLead);
              const selectedSubId = mainSubFilters[col.id] || 'all';
              const activeSub = col.subStages.find((s) => s.id === selectedSubId);
              const displayedLeads = activeSub
                ? allStageLeads.filter(activeSub.matches)
                : allStageLeads;

              const isMainTarget = dragOverTarget === `col-${col.id}`;
              const isConverted = col.id === 'Converted';
              const isRedundant = col.id === 'Redundant';

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOverTarget(e, `col-${col.id}`)}
                  onDragLeave={() => {
                    if (dragOverTarget === `col-${col.id}`) setDragOverTarget(null);
                  }}
                  onDrop={(e) => handleDropOnMainColumn(e, col)}
                  className={`w-[272px] shrink-0 rounded-2xl flex flex-col transition-all duration-200 border ${
                    isConverted
                      ? 'bg-[#0b1d28]/70 border-emerald-500/30'
                      : isRedundant
                      ? 'bg-[#0e1626]/50 border-white/[0.05]'
                      : 'bg-[#0f1b35] border-white/[0.08]'
                  } ${isMainTarget ? 'ring-2 ring-blue-500/80 bg-blue-900/20' : ''}`}
                >
                  {/* Main Stage Header */}
                  <div className="p-3 border-b border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBoard(col.id)}
                        className="flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity cursor-pointer text-left"
                        title={`Open separate ${col.title} Kanban board`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                        <h3 className="text-xs font-bold text-white tracking-wide truncate">
                          {col.title}
                        </h3>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${col.accent}`}
                        >
                          {allStageLeads.length}
                        </span>
                        <button
                          onClick={() => onOpenAddModalWithStage(col.id)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
                          title={`Add Lead in ${col.title}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-Stage Filter Dropdown */}
                    {col.subStages.length > 0 && (
                      <div className="relative flex items-center">
                        <Filter className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                        <select
                          value={selectedSubId}
                          onChange={(e) =>
                            setMainSubFilters((prev) => ({
                              ...prev,
                              [col.id]: e.target.value,
                            }))
                          }
                          className="w-full pl-6 pr-2 py-1 text-[11px] bg-[#090f1d] border border-white/[0.08] text-slate-200 rounded-lg focus:border-blue-500 cursor-pointer"
                          title={`Filter ${col.title} follow-ups`}
                        >
                          <option value="all">All Follow-ups ({allStageLeads.length})</option>
                          {col.subStages.map((sub) => {
                            const count = allStageLeads.filter(sub.matches).length;
                            return (
                              <option key={sub.id} value={sub.id}>
                                {sub.label} ({count})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="p-2.5 space-y-2.5 min-h-[500px] flex-1">
                    {displayedLeads.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-white/[0.05] rounded-xl flex items-center justify-center text-center p-3">
                        <p className="text-[11px] text-slate-500">Drop leads here</p>
                      </div>
                    ) : (
                      displayedLeads.map((lead) => renderLeadCard(lead, isConverted, true))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: All Separate Stage Kanban Boards Stacked */}
      {selectedBoard === 'all-boards' && (
        <div className="space-y-6">
          {MAIN_COLUMNS.map((col) => renderDedicatedStageBoard(col))}
        </div>
      )}

      {/* View 3: Single Stage's Dedicated Separate Kanban Board */}
      {selectedBoard !== 'main' &&
        selectedBoard !== 'all-boards' &&
        renderDedicatedStageBoard(
          MAIN_COLUMNS.find((c) => c.id === selectedBoard) || MAIN_COLUMNS[0]
        )}

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
