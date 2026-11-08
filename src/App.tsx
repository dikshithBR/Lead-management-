import React, { useState } from 'react';
import { LeadProvider, useLeadContext } from './context/LeadContext';
import { Navbar, ActiveView } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { ActionsTodayView } from './components/ActionsTodayView';
import { LeadModal } from './components/LeadModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NotificationToast } from './components/NotificationToast';
import { Lead, PipelineStage } from './types/lead';

const MainApp: React.FC = () => {
  const { deleteLead } = useLeadContext();

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [initialStageForModal, setInitialStageForModal] = useState<PipelineStage>('Inquired');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const handleOpenAddModal = (stage: PipelineStage = 'Inquired') => {
    setLeadToEdit(null);
    setInitialStageForModal(stage);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const handleConfirmDelete = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete.id);
      setLeadToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090f1d] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddModal={() => handleOpenAddModal('Inquired')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'dashboard' && (
          <DashboardView
            onEditLead={handleEditLead}
            onRequestDelete={handleRequestDelete}
            onOpenAddModal={() => handleOpenAddModal('Inquired')}
          />
        )}

        {activeView === 'kanban' && (
          <KanbanView
            onEditLead={handleEditLead}
            onRequestDelete={handleRequestDelete}
            onOpenAddModalWithStage={(stage) => handleOpenAddModal(stage)}
          />
        )}

        {activeView === 'actions' && (
          <ActionsTodayView
            onEditLead={handleEditLead}
            onOpenAddModal={() => handleOpenAddModal('Inquired')}
          />
        )}
      </main>

      {/* Modals & Notifications */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLeadToEdit(null);
        }}
        leadToEdit={leadToEdit}
        initialStage={initialStageForModal}
      />

      <DeleteConfirmModal
        isOpen={leadToDelete !== null}
        lead={leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <NotificationToast />

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.04] py-4 bg-[#090f1d] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 LeadFlow CRM • High-Velocity Client Pipeline CRM</p>
          <p className="font-mono text-[11px] text-slate-400">
            Offline-First Local Storage Engine
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LeadProvider>
      <MainApp />
    </LeadProvider>
  );
}
