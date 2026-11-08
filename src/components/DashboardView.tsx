import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  X,
  Phone,
  MessageSquare,
  MapPin,
  Tag,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Lead, PipelineStage, ALL_STAGES, UrgencyStatus } from '../types/lead';
import { useLeadContext } from '../context/LeadContext';
import { formatDueDateLabel, formatWhatsAppUrl } from '../utils/dateUtils';
import { exportLeadsToCSV } from '../utils/csvExport';

interface DashboardViewProps {
  onEditLead: (lead: Lead) => void;
  onRequestDelete: (lead: Lead) => void;
  onOpenAddModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onEditLead,
  onRequestDelete,
  onOpenAddModal,
}) => {
  const { leads, allSources, allVenues, changeStage } = useLeadContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyStatus | 'all'>('all');

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    stageFilter !== 'all' ||
    sourceFilter !== 'all' ||
    venueFilter !== 'all' ||
    urgencyFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setSourceFilter('all');
    setVenueFilter('all');
    setUrgencyFilter('all');
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return leads.filter((lead) => {
      // Search
      if (q) {
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = lead.phone.toLowerCase().includes(q);
        const matchVenue = lead.venue.toLowerCase().includes(q);
        const matchSource = lead.leadSource.toLowerCase().includes(q);
        const matchNote = lead.nextActionNote.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchVenue && !matchSource && !matchNote) {
          return false;
        }
      }

      // Stage
      if (stageFilter !== 'all' && lead.stage !== stageFilter) return false;
      // Source
      if (sourceFilter !== 'all' && lead.leadSource !== sourceFilter) return false;
      // Venue
      if (venueFilter !== 'all' && lead.venue !== venueFilter) return false;

      // Urgency
      if (urgencyFilter !== 'all') {
        const { status } = formatDueDateLabel(lead.actionDueDate);
        if (status !== urgencyFilter) return false;
      }

      return true;
    });
  }, [leads, searchQuery, stageFilter, sourceFilter, venueFilter, urgencyFilter]);

  const handleExportCSV = () => {
    exportLeadsToCSV(filteredLeads, `leadflow_export_${Date.now()}.csv`);
  };

  const getStageColorBadge = (stage: PipelineStage) => {
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
      case 'Converted':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
      case 'Redundant':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Search Bar */}
      <div className="bg-[#0f1b35] border border-white/[0.08] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, venue, source, or action notes..."
              className="w-full pl-9 pr-8 py-2 bg-[#090f1d] border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs text-white placeholder-slate-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export CSV & Add Lead quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#18274b] hover:bg-[#1f3363] border border-white/[0.08] rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-sm"
              title="Download filtered leads as CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV ({filteredLeads.length})</span>
            </button>
          </div>

        </div>

        {/* Filter Dropdowns Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">Filters:</span>
          </div>

          {/* Stage Dropdown */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as PipelineStage | 'all')}
            className="px-2.5 py-1.5 bg-[#090f1d] border border-white/[0.08] rounded-xl text-xs text-slate-200 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Stages ({leads.length})</option>
            {ALL_STAGES.map((s) => (
              <option key={s} value={s}>
                {s} ({leads.filter((l) => l.stage === s).length})
              </option>
            ))}
          </select>

          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#090f1d] border border-white/[0.08] rounded-xl text-xs text-slate-200 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Sources</option>
            {allSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Venue Dropdown */}
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#090f1d] border border-white/[0.08] rounded-xl text-xs text-slate-200 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Venues</option>
            {allVenues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {/* Urgency Filter Dropdown */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as UrgencyStatus | 'all')}
            className="px-2.5 py-1.5 bg-[#090f1d] border border-white/[0.08] rounded-xl text-xs text-slate-200 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue Deadlines</option>
            <option value="today">Due Today</option>
            <option value="upcoming">Upcoming</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400 font-mono">
            Showing <span className="font-bold text-white">{filteredLeads.length}</span> of {leads.length} leads
          </div>
        </div>
      </div>

      {/* Main Scannable Data Table */}
      <div className="bg-[#0f1b35] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-[#090f1d]/75 border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Next Action Deadline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-semibold text-slate-300">No leads match your criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search for another term.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-3 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs hover:bg-blue-600/30 transition-colors"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const urgency = formatDueDateLabel(lead.actionDueDate);
                  const waUrl = formatWhatsAppUrl(lead.phone, lead.name, lead.venue);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-300 shrink-0">
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block text-sm">
                              {lead.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & WhatsApp Link */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                            className="text-slate-300 hover:text-blue-400 font-mono transition-colors flex items-center gap-1"
                            title="Direct Phone Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.phone}</span>
                          </a>
                          
                          {/* WhatsApp Direct */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-all ml-1"
                            title="Open WhatsApp Chat with client"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Venue */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs">
                          <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{lead.venue}</span>
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
                          <Tag className="w-3 h-3" />
                          <span>{lead.leadSource}</span>
                        </span>
                      </td>

                      {/* Stage (with inline stage switcher) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={lead.stage}
                          onChange={(e) => changeStage(lead.id, e.target.value as PipelineStage)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-[#090f1d] ${getStageColorBadge(
                            lead.stage
                          )}`}
                        >
                          {ALL_STAGES.map((s) => (
                            <option key={s} value={s} className="bg-[#0f1b35] text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Next Action & Urgency Badge */}
                      <td className="py-3 px-4">
                        <div className="max-w-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                                urgency.status === 'overdue'
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : urgency.status === 'today'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              }`}
                            >
                              {urgency.text}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{urgency.subtext}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 truncate" title={lead.nextActionNote}>
                            {lead.nextActionNote}
                          </p>
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit Lead Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRequestDelete(lead)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
