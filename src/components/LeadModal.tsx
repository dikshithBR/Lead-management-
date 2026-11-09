import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Calendar, Phone, User as UserIcon, MapPin, Tag, Check } from 'lucide-react';
import { Lead, PipelineStage, ALL_STAGES } from '../types/lead';
import { useLeadContext } from '../context/LeadContext';
import { getTodayDateString, offsetDateString, calculateTargetStageDeadline } from '../utils/dateUtils';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
  initialStage?: PipelineStage;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  leadToEdit,
  initialStage = 'Inquired',
}) => {
  const {
    allSources,
    allVenues,
    addLead,
    updateLead,
    addCustomSource,
    addCustomVenue,
  } = useLeadContext();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<PipelineStage>(initialStage);
  const [nextActionNote, setNextActionNote] = useState('');
  const [actionDueDate, setActionDueDate] = useState(getTodayDateString());
  const [leadSource, setLeadSource] = useState(allSources[0] || 'Website Direct');
  const [venue, setVenue] = useState(allVenues[0] || 'Downtown Executive Hub');

  // Custom Source creation state
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');

  // Custom Venue creation state
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (leadToEdit) {
      setName(leadToEdit.name);
      setPhone(leadToEdit.phone);
      setStage(leadToEdit.stage);
      setNextActionNote(leadToEdit.nextActionNote);
      setActionDueDate(leadToEdit.actionDueDate);
      setLeadSource(leadToEdit.leadSource);
      setVenue(leadToEdit.venue);
    } else {
      setName('');
      setPhone('');
      setStage(initialStage);
      setNextActionNote('Initial discovery call & qualification of client requirements.');
      setActionDueDate(getTodayDateString());
      setLeadSource(allSources[0] || 'Website Direct');
      setVenue(allVenues[0] || 'Downtown Executive Hub');
    }
    setIsAddingSource(false);
    setIsAddingVenue(false);
    setNewSourceName('');
    setNewVenueName('');
    setErrors({});
  }, [leadToEdit, initialStage, isOpen, allSources, allVenues]);

  if (!isOpen) return null;

  const handleCreateCustomSource = async () => {
    if (!newSourceName.trim()) return;
    const nameToSave = newSourceName.trim();
    await addCustomSource(nameToSave);
    setLeadSource(nameToSave);
    setNewSourceName('');
    setIsAddingSource(false);
  };

  const handleCreateCustomVenue = async () => {
    if (!newVenueName.trim()) return;
    const nameToSave = newVenueName.trim();
    await addCustomVenue(nameToSave);
    setVenue(nameToSave);
    setNewVenueName('');
    setIsAddingVenue(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Lead name is required';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (phone.replace(/\D/g, '').length < 5) {
      errs.phone = 'Please provide a valid phone number with dial code';
    }
    if (!nextActionNote.trim()) errs.nextActionNote = 'Next action note is required';
    if (!actionDueDate) errs.actionDueDate = 'Action deadline date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (leadToEdit) {
        await updateLead(leadToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          stage,
          nextActionNote: nextActionNote.trim(),
          actionDueDate,
          leadSource,
          venue,
        });
      } else {
        await addLead({
          name: name.trim(),
          phone: phone.trim(),
          stage,
          nextActionNote: nextActionNote.trim(),
          actionDueDate,
          leadSource,
          venue,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = getTodayDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0f1b35] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#090f1d]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {leadToEdit ? 'Edit Lead Profile' : 'Create New Lead'}
              </h3>
              <p className="text-xs text-slate-400">
                {leadToEdit ? 'Update details, stage, and action deadline' : 'Add client to the pipeline with actionable follow-up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Row 1: Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Client Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jessica Sterling"
                  className="w-full pl-9 pr-3 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition-colors"
                />
              </div>
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (WhatsApp Ready) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full pl-9 pr-3 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition-colors"
                />
              </div>
              {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Row 2: Stage */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pipeline Stage <span className="text-rose-400">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => {
                const newS = e.target.value as PipelineStage;
                setStage(newS);
                if (newS === 'Call on Custom Date') {
                  if (!nextActionNote || nextActionNote.includes('Initial discovery')) {
                    setNextActionNote('Client requested call-back on this date.');
                  }
                  setActionDueDate(offsetDateString(today, 1));
                } else {
                  const rule = calculateTargetStageDeadline(newS);
                  setActionDueDate(rule.dueDateStr);
                  if (!nextActionNote || nextActionNote.includes('Initial discovery') || nextActionNote.includes('follow-up') || nextActionNote.includes('trial')) {
                    setNextActionNote(rule.note);
                  }
                }
              }}
              className={`w-full px-3 py-2 bg-[#090f1d] border focus:ring-1 rounded-xl text-sm text-white transition-colors cursor-pointer ${
                stage === 'Call on Custom Date'
                  ? 'border-violet-500/50 focus:border-violet-500 focus:ring-violet-500'
                  : 'border-white/[0.08] focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              {ALL_STAGES.map((s) => (
                <option key={s} value={s} className="bg-[#0f1b35] text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {stage === 'Call on Custom Date' && (
            <div className="p-3 bg-violet-950/30 border border-violet-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                <span>Client Requested Custom Call Date</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Please pick the exact date below the client requested for the follow-up call.
              </p>
            </div>
          )}

          {/* Row 3: Next Action Deadline & Quick Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Next Action Deadline <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActionDueDate(today)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setActionDueDate(offsetDateString(today, 1))}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setActionDueDate(offsetDateString(today, 3))}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setActionDueDate(offsetDateString(today, 7))}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  +1 Week
                </button>
              </div>
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={actionDueDate}
                onChange={(e) => setActionDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white font-mono transition-colors"
              />
            </div>
            {errors.actionDueDate && <p className="text-xs text-rose-400 mt-1">{errors.actionDueDate}</p>}
          </div>

          {/* Row 4: Next Action Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Next Action Description / Task <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={nextActionNote}
              onChange={(e) => setNextActionNote(e.target.value)}
              placeholder="e.g. Call to discuss customized venue package terms and send calendar invite."
              className="w-full px-3 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition-colors resize-none"
            />
            {errors.nextActionNote && <p className="text-xs text-rose-400 mt-1">{errors.nextActionNote}</p>}
          </div>

          {/* Row 5: Venue & Lead Source with On-The-Fly Creation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Venue Dropdown / Creator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  Venue Location
                </label>
                {!isAddingVenue && (
                  <button
                    type="button"
                    onClick={() => setIsAddingVenue(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    New Venue
                  </button>
                )}
              </div>

              {isAddingVenue ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder="Enter new venue name..."
                    className="flex-1 px-3 py-1.5 bg-[#090f1d] border border-blue-500/50 rounded-xl text-xs text-white placeholder-slate-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomVenue}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingVenue(false);
                      setNewVenueName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={venue}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingVenue(true);
                    } else {
                      setVenue(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white transition-colors cursor-pointer"
                >
                  {allVenues.map((v) => (
                    <option key={v} value={v} className="bg-[#0f1b35] text-white">
                      {v}
                    </option>
                  ))}
                  <option value="__add_new__" className="bg-[#18274b] text-blue-300 font-semibold">
                    + Add Custom Venue...
                  </option>
                </select>
              )}
            </div>

            {/* Lead Source Dropdown / Creator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Lead Source
                </label>
                {!isAddingSource && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSource(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    New Source
                  </button>
                )}
              </div>

              {isAddingSource ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Enter new lead source..."
                    className="flex-1 px-3 py-1.5 bg-[#090f1d] border border-blue-500/50 rounded-xl text-xs text-white placeholder-slate-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomSource}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSource(false);
                      setNewSourceName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={leadSource}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingSource(true);
                    } else {
                      setLeadSource(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white transition-colors cursor-pointer"
                >
                  {allSources.map((s) => (
                    <option key={s} value={s} className="bg-[#0f1b35] text-white">
                      {s}
                    </option>
                  ))}
                  <option value="__add_new__" className="bg-[#18274b] text-blue-300 font-semibold">
                    + Add Custom Source...
                  </option>
                </select>
              )}
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-400/40 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : leadToEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
