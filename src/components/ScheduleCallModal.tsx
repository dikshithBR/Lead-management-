import React, { useState, useEffect } from 'react';
import { X, Calendar, Phone, Clock, MessageSquare, Check, Sparkles } from 'lucide-react';
import { Lead, PipelineStage } from '../types/lead';
import { getTodayDateString, offsetDateString, formatWhatsAppUrl, openWhatsApp } from '../utils/dateUtils';

interface ScheduleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  targetStage?: PipelineStage;
  onConfirm: (customDate: string, customNote: string) => Promise<void>;
}

export const ScheduleCallModal: React.FC<ScheduleCallModalProps> = ({
  isOpen,
  onClose,
  lead,
  targetStage = 'Call on Custom Date',
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      // Default to tomorrow or current due date if in the future
      const tomorrow = offsetDateString(getTodayDateString(), 1);
      const initialDate = lead.actionDueDate >= getTodayDateString() ? lead.actionDueDate : tomorrow;
      setSelectedDate(initialDate);
      setCustomNote(`Client requested call-back on this date.`);
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const today = getTodayDateString();
  const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);

  const presets = [
    { label: 'Tomorrow', offset: 1 },
    { label: 'In 2 Days', offset: 2 },
    { label: 'In 3 Days', offset: 3 },
    { label: 'In 1 Week', offset: 7 },
  ];

  const handlePresetClick = (offset: number) => {
    const newDate = offsetDateString(today, offset);
    setSelectedDate(newDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedDate, customNote.trim() || 'Client requested call-back on this date.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0f1b35] border border-violet-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-gradient-to-r from-violet-950/40 via-[#0f1b35] to-[#090f1d]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Set Custom Client Call Date</span>
              </h3>
              <p className="text-xs text-slate-400">
                Move to <span className="text-violet-300 font-medium">"{targetStage}"</span> stage
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

        {/* Client Mini Summary */}
        <div className="px-6 py-3 bg-[#090f1d]/70 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white block">{lead.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{lead.phone} • {lead.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone.replace(/\s+/g, '')}`}
              className="p-1.5 bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white rounded-lg border border-white/[0.08] transition-colors"
              title="Call client"
            >
              <Phone className="w-3.5 h-3.5" />
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Quick Preset (relative to today)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((p) => {
                const targetD = offsetDateString(today, p.offset);
                const isSelected = selectedDate === targetD;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetClick(p.offset)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-all text-center ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                        : 'bg-[#090f1d] hover:bg-[#18274b] text-slate-300 border-white/[0.08]'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>Exact Call Date</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#090f1d] border border-white/[0.1] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-xs text-white transition-colors cursor-pointer"
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span>Call Objective / Notes</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Client asked to call back regarding team schedule & package options"
              className="w-full px-3.5 py-2.5 bg-[#090f1d] border border-white/[0.1] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-xs text-white placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Modal Footer Buttons */}
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
              disabled={isSubmitting || !selectedDate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Set Date & Update Stage'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
