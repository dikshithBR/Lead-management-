import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, PhoneCall, Sparkles, MessageSquare, Clock } from 'lucide-react';
import { Lead, PipelineStage } from '../types/lead';
import { calculateTargetStageDeadline, formatWhatsAppUrl, openWhatsApp } from '../utils/dateUtils';

interface ReturnToPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onConfirm: (targetStage: PipelineStage, callOutcomeNote: string) => Promise<void>;
}

interface StageOption {
  stage: PipelineStage;
  label: string;
  deadlineText: string;
  badgeClass: string;
  description: string;
}

const RETURN_OPTIONS: StageOption[] = [
  {
    stage: 'Trial',
    label: 'Trial Session',
    deadlineText: 'Due in 1 Day',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    description: 'Booked or rescheduled for client trial session.',
  },
  {
    stage: 'First Follow-up',
    label: '1st Follow-up',
    deadlineText: 'Due in 12 Hours',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    description: 'Trial completed; follow-up scheduled within 12 hours.',
  },
  {
    stage: 'Second Follow-up',
    label: '2nd Follow-up',
    deadlineText: 'Due in 2 Days',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    description: 'Follow-up regarding membership package and quote terms.',
  },
  {
    stage: 'Second Trial',
    label: '2nd Trial Session',
    deadlineText: 'Due in 2 Days',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    description: 'Client booked second trial session for deep dive.',
  },
  {
    stage: 'Third Follow-up',
    label: '3rd Follow-up',
    deadlineText: 'Due in 12 Hours',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    description: 'Post-2nd-trial closing follow-up within 12 hours.',
  },
  {
    stage: 'Converted',
    label: 'Converted Won 🏆',
    deadlineText: 'Completed',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    description: 'Client agreed, paid, or signed up on the call!',
  },
];

export const ReturnToPipelineModal: React.FC<ReturnToPipelineModalProps> = ({
  isOpen,
  onClose,
  lead,
  onConfirm,
}) => {
  const [selectedStage, setSelectedStage] = useState<PipelineStage>('Trial');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);
  const targetRule = calculateTargetStageDeadline(selectedStage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalNote = outcomeNote.trim()
        ? `Call completed: ${outcomeNote.trim()} -> ${targetRule.note}`
        : targetRule.note;
      await onConfirm(selectedStage, finalNote);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0f1b35] border border-blue-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-gradient-to-r from-blue-950/50 via-[#0f1b35] to-[#090f1d]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Call Completed: Return to Pipeline</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pick which stage to add <span className="text-blue-300 font-semibold">{lead.name}</span> back into
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client details bar */}
        <div className="px-6 py-3 bg-[#090f1d]/70 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white block">{lead.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{lead.phone} • {lead.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone.replace(/\s+/g, '')}`}
              className="p-1.5 bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 rounded-lg border border-white/[0.08] transition-colors"
              title="Call"
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </a>
            <a
              href={waUrl}
              onClick={(e) => {
                e.preventDefault();
                openWhatsApp(lead.phone, lead.name, lead.venue, 'business');
              }}
              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-colors flex items-center gap-1 text-xs cursor-pointer"
              title="Chat on WhatsApp Business"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold">WA Business</span>
            </a>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Pipeline Stage (Automated Rule-Based Deadline):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {RETURN_OPTIONS.map((opt) => {
                const isSelected = selectedStage === opt.stage;
                return (
                  <button
                    key={opt.stage}
                    type="button"
                    onClick={() => setSelectedStage(opt.stage)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-400 ring-1 ring-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-[#090f1d] border-white/[0.08] hover:border-white/[0.2] hover:bg-[#142244]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white">{opt.label}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${opt.badgeClass}`}>
                        {opt.deadlineText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enforced deadline notice */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-blue-200">Enforced Flow Rule:</span>
              <p className="text-slate-300 text-[11px]">
                Target: <span className="font-bold text-white">{selectedStage}</span>. Follow-up deadline automatically set to <span className="font-bold text-amber-300 font-mono">{targetRule.dueDateStr}</span> ({targetRule.label}).
              </p>
            </div>
          </div>

          {/* Call Outcome Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Call Outcome / Next Instructions</span>
            </label>
            <input
              type="text"
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder="e.g. Spoke to client, confirmed trial for tomorrow afternoon"
              className="w-full px-3.5 py-2.5 bg-[#090f1d] border border-white/[0.1] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs text-white placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Updating...' : `Add to ${selectedStage}`}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
