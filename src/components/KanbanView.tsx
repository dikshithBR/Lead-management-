import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  MapPin,
  Tag,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Trophy,
  ArrowRight,
  GripVertical,
  Plus,
} from 'lucide-react';
import { Lead, PipelineStage, ALL_STAGES } from '../types/lead';
import { useLeadContext } from '../context/LeadContext';
import { formatDueDateLabel, formatWhatsAppUrl } from '../utils/dateUtils';

interface KanbanViewProps {
  onEditLead: (lead: Lead) => void;
  onRequestDelete: (lead: Lead) => void;
  onOpenAddModalWithStage: (stage: PipelineStage) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  onEditLead,
  onRequestDelete,
  onOpenAddModalWithStage,
}) => {
  const { leads, changeStage } = useLeadContext();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (stage: PipelineStage) => {
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      await changeStage(leadId, targetStage);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const getStageHeaderStyle = (stage: PipelineStage) => {
    switch (stage) {
      case 'Inquired':
        return {
          accent: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
          dot: 'bg-blue-400',
        };
      case 'Trial':
        return {
          accent: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
          dot: 'bg-cyan-400',
        };
      case 'First Follow-up':
        return {
          accent: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
          dot: 'bg-indigo-400',
        };
      case 'Second Follow-up':
        return {
          accent: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
          dot: 'bg-purple-400',
        };
      case 'Second Trial':
        return {
          accent: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
          dot: 'bg-amber-400',
        };
      case 'Converted':
        return {
          accent: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
          dot: 'bg-emerald-400',
        };
      case 'Redundant':
        return {
          accent: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* Kanban Board Horizontal Scrolling Canvas */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1750px] items-start">
          {ALL_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            const isTargetColumn = dragOverStage === stage;
            const style = getStageHeaderStyle(stage);
            const isConverted = stage === 'Converted';
            const isRedundant = stage === 'Redundant';

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={() => handleDragLeave(stage)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-[245px] shrink-0 rounded-2xl flex flex-col transition-all duration-200 border ${
                  isConverted
                    ? 'bg-[#0b1d28]/70 border-emerald-500/30'
                    : isRedundant
                    ? 'bg-[#0e1626]/50 border-white/[0.05]'
                    : 'bg-[#0f1b35] border-white/[0.08]'
                } ${
                  isTargetColumn
                    ? 'ring-2 ring-blue-500/80 bg-blue-900/20 scale-[1.01]'
                    : ''
                }`}
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <h3 className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
                      {stage}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${style.accent}`}>
                      {stageLeads.length}
                    </span>
                    <button
                      onClick={() => onOpenAddModalWithStage(stage)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
                      title={`Add Lead in ${stage}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stage Leads Cards Container */}
                <div className="p-2 space-y-2.5 min-h-[500px] flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-white/[0.05] rounded-xl flex items-center justify-center text-center p-3">
                      <p className="text-[11px] text-slate-500">Drop leads here</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const urgency = formatDueDateLabel(lead.actionDueDate);
                      const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);
                      const isDragging = draggedLeadId === lead.id;

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
                          {/* Card Top: Drag handle and Name */}
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-slate-300" />
                              <h4 className="text-xs font-bold text-white truncate">{lead.name}</h4>
                            </div>
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
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
                              title="Open WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
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

                          {/* Due Date Urgency Badge */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.04]">
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

                            {/* Direct Stage Switcher Dropdown & Edit / Delete */}
                            <div className="flex items-center gap-1">
                              <select
                                value={lead.stage}
                                onChange={(e) => changeStage(lead.id, e.target.value as PipelineStage)}
                                className="text-[10px] py-0.5 px-1 bg-[#18274b] border border-white/[0.08] text-slate-300 rounded focus:border-blue-500 cursor-pointer"
                                title="Change Stage"
                              >
                                {ALL_STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => onEditLead(lead)}
                                className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onRequestDelete(lead)}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
