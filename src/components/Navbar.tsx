import React from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarCheck2,
  Plus,
  Sparkles,
  Trophy,
  Activity,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useLeadContext } from '../context/LeadContext';

export type ActiveView = 'dashboard' | 'kanban' | 'actions';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenAddModal,
}) => {
  const { kpiStats } = useLeadContext();

  return (
    <header className="sticky top-0 z-40 bg-[#090f1d]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200">
                  LeadFlow
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Enterprise CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Pipeline & Follow-up Velocity</p>
            </div>
          </div>

          {/* Live KPI Stats Strip (Desktop View) */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0f1b35] border border-white/[0.08] rounded-xl px-3 py-1.5 shadow-inner">
            <div className="flex items-center gap-2 px-2.5 py-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                <span className="text-xs font-bold text-white font-mono">{kpiStats.totalLeads}</span>
              </div>
            </div>
            
            <div className="h-6 w-px bg-white/[0.08]" />

            <div className="flex items-center gap-2 px-2.5 py-1">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-blue-300/80 tracking-wider">Pipeline</span>
                <span className="text-xs font-bold text-blue-400 font-mono">{kpiStats.inPipeline}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/[0.08]" />

            <div className="flex items-center gap-2 px-2.5 py-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-emerald-300/80 tracking-wider">Won</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{kpiStats.convertedWon}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/[0.08]" />

            <div className="flex items-center gap-2 px-2.5 py-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-wider">Win Rate</span>
                <span className="text-xs font-bold text-indigo-300 font-mono">{kpiStats.conversionRate}%</span>
              </div>
            </div>
          </div>

          {/* Action Button: + Add Lead */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-400/40 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs Bar */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none border-t border-white/[0.04]">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
            <span className="ml-1 text-[11px] font-mono opacity-70">({kpiStats.totalLeads})</span>
          </button>

          <button
            onClick={() => setActiveView('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'kanban'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
              7 Stages
            </span>
          </button>

          <button
            onClick={() => setActiveView('actions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'actions'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Actions for Today</span>
            {kpiStats.dueTodayOrOverdueCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {kpiStats.dueTodayOrOverdueCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
