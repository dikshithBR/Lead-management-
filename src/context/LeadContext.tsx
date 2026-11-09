import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Lead,
  PipelineStage,
  DEFAULT_SOURCES,
  DEFAULT_VENUES,
} from '../types/lead';
import { db } from '../firebase';
import {
  getTodayDateString,
  offsetDateString,
  getUrgencyStatus,
  STAGE_PROGRESSION,
  calculateTargetStageDeadline,
} from '../utils/dateUtils';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface LeadContextType {
  leads: Lead[];
  isCloudConnected: boolean;
  customSources: string[];
  customVenues: string[];
  allSources: string[];
  allVenues: string[];
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  
  // Lead CRUD
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<string>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  clearAllLeads: () => Promise<void>;

  // Fast Actions
  markActionDone: (id: string) => Promise<void>;
  rescheduleLead: (id: string, daysOffset: number) => Promise<void>;
  changeStage: (id: string, newStage: PipelineStage, extraUpdates?: Partial<Lead>) => Promise<void>;
  advanceToNextStage: (id: string) => Promise<void>;

  // Custom metadata
  addCustomSource: (source: string) => Promise<void>;
  addCustomVenue: (venue: string) => Promise<void>;

  // Computed metrics
  kpiStats: {
    totalLeads: number;
    inPipeline: number;
    convertedWon: number;
    conversionRate: number;
    dueTodayOrOverdueCount: number;
    dueTodayCount: number;
    overdueCount: number;
    upcomingCount: number;
    completedTodayCount: number;
  };
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

const LOCAL_STORAGE_LEADS_KEY = 'leadflow_leads_v4';
const LOCAL_STORAGE_SOURCES_KEY = 'leadflow_sources_v4';
const LOCAL_STORAGE_VENUES_KEY = 'leadflow_venues_v4';

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any sample data
          return parsed.filter(
            (l: Lead) => !l.id?.startsWith('sample-lead-') && !l.name?.includes('Sophia Martinez')
          );
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [customSources, setCustomSources] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SOURCES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });

  const [customVenues, setCustomVenues] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_VENUES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Set up Real-time Firestore sync with multi-device resilience
  useEffect(() => {
    const leadsCol = collection(db, 'leads');

    const unsubscribeLeads = onSnapshot(
      leadsCol,
      async (snapshot) => {
        setIsCloudConnected(true);

        if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
          // Check if this device has local leads created offline or prior to sync
          const localStr = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
          if (localStr) {
            try {
              const localParsed: Lead[] = JSON.parse(localStr);
              const validLocal = localParsed.filter(
                (l) => !l.id?.startsWith('sample-lead-') && l.name && l.stage
              );
              if (validLocal.length > 0) {
                // Upload local leads to Cloud Firestore so phone and all devices receive them!
                const batch = writeBatch(db);
                validLocal.forEach((l) => {
                  batch.set(doc(db, 'leads', l.id), l);
                });
                await batch.commit();
                return;
              }
            } catch (migrationErr) {
              console.warn('Local leads sync check:', migrationErr);
            }
          }
          setLeads([]);
          localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify([]));
          return;
        }

        const remoteLeads: Lead[] = [];
        const sampleIdsToDelete: string[] = [];

        snapshot.forEach((docSnap) => {
          const lead = docSnap.data() as Lead;
          const isSample =
            docSnap.id.startsWith('sample-lead-') ||
            lead.id?.startsWith('sample-lead-') ||
            lead.name === 'Sophia Martinez' ||
            lead.name === 'Alexander Wright';

          if (isSample) {
            sampleIdsToDelete.push(docSnap.id);
          } else {
            remoteLeads.push(lead);
          }
        });

        // Automatically delete any discovered sample leads from Firestore
        if (sampleIdsToDelete.length > 0) {
          try {
            const batch = writeBatch(db);
            sampleIdsToDelete.forEach((sId) => {
              batch.delete(doc(db, 'leads', sId));
            });
            await batch.commit();
          } catch (cleanErr) {
            console.warn('Sample leads deletion notice:', cleanErr);
          }
        }

        // Sort by actionDueDate ascending
        remoteLeads.sort((a, b) => a.actionDueDate.localeCompare(b.actionDueDate));
        setLeads(remoteLeads);
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(remoteLeads));
      },
      (error) => {
        setIsCloudConnected(false);
        console.warn('Firestore real-time sync notice (using local offline storage):', error);
      }
    );

    // Sync settings (custom venues and sources)
    const settingsDoc = doc(db, 'userSettings', 'global');
    const unsubscribeSettings = onSnapshot(
      settingsDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.customSources)) {
            setCustomSources(data.customSources);
            localStorage.setItem(LOCAL_STORAGE_SOURCES_KEY, JSON.stringify(data.customSources));
          }
          if (Array.isArray(data.customVenues)) {
            setCustomVenues(data.customVenues);
            localStorage.setItem(LOCAL_STORAGE_VENUES_KEY, JSON.stringify(data.customVenues));
          }
        }
      },
      (error) => {
        console.warn('Settings sync notice:', error);
      }
    );

    return () => {
      unsubscribeLeads();
      unsubscribeSettings();
    };
  }, []);

  // Combined sources & venues
  const allSources = useMemo(() => {
    return Array.from(new Set([...DEFAULT_SOURCES, ...customSources]));
  }, [customSources]);

  const allVenues = useMemo(() => {
    return Array.from(new Set([...DEFAULT_VENUES, ...customVenues]));
  }, [customVenues]);

  // Add Lead
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<string> => {
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const newLead: Lead = {
      ...leadData,
      id: leadId,
      ownerId: 'shared-user',
      createdAt: nowIso,
      updatedAt: nowIso,
      isCompletedToday: false,
    };

    // Optimistic update
    const updated = [newLead, ...leads];
    setLeads(updated);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updated));
    showToast('success', 'Lead Created', `Added "${newLead.name}" to pipeline.`);

    // Persist to Cloud Firestore
    try {
      await setDoc(doc(db, 'leads', leadId), newLead);
    } catch (err) {
      console.warn('Cloud sync error, saved locally:', err);
    }

    return leadId;
  };

  // Update Lead
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const current = leads.find((l) => l.id === id);
    if (!current) return;

    const updatedLead: Lead = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.stage === 'Converted' && current.stage !== 'Converted') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#6366f1', '#fbbf24', '#34d399'],
      });
      showToast('success', 'Deal Converted Won! 🏆', `${current.name} marked as Won!`);
    }

    const newLeads = leads.map((l) => (l.id === id ? updatedLead : l));
    setLeads(newLeads);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(newLeads));

    try {
      await setDoc(doc(db, 'leads', id), updatedLead);
    } catch (err) {
      console.warn('Cloud sync error, saved locally:', err);
    }
  };

  // Change Stage with automated workflow rule calculation
  const changeStage = async (id: string, newStage: PipelineStage, extraUpdates?: Partial<Lead>) => {
    const current = leads.find((l) => l.id === id);
    if (!current) return;

    let autoUpdates: Partial<Lead> = {};
    // If actionDueDate not manually overridden and stage is changing
    if (!extraUpdates?.actionDueDate && newStage !== current.stage && newStage !== 'Call on Custom Date') {
      const rule = calculateTargetStageDeadline(newStage);
      autoUpdates = {
        actionDueDate: rule.dueDateStr,
        nextActionNote: extraUpdates?.nextActionNote || rule.note,
        isCompletedToday: false,
      };
    }

    await updateLead(id, { stage: newStage, ...autoUpdates, ...extraUpdates });
    showToast('info', 'Stage Updated', `Moved ${current.name} to "${newStage}".`);
  };

  // 1-Click Advance to Next Stage according to enforced progression
  const advanceToNextStage = async (id: string) => {
    const current = leads.find((l) => l.id === id);
    if (!current) return;

    const progression = STAGE_PROGRESSION[current.stage];
    if (!progression?.nextStage) {
      showToast('warning', 'Pipeline Completed', `"${current.stage}" has no subsequent progression stage.`);
      return;
    }

    const nextStage = progression.nextStage;
    const rule = calculateTargetStageDeadline(nextStage);
    await updateLead(id, {
      stage: nextStage,
      actionDueDate: rule.dueDateStr,
      nextActionNote: rule.note,
      isCompletedToday: false,
    });

    showToast(
      'success',
      `Advanced to ${nextStage}`,
      `Follow-up deadline scheduled: ${rule.label} (${rule.dueDateStr})`
    );
  };

  // Delete Lead
  const deleteLead = async (id: string) => {
    const target = leads.find((l) => l.id === id);
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updated));
    showToast('info', 'Lead Deleted', `Removed ${target?.name || 'lead'}.`);

    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (err) {
      console.warn('Cloud delete error, deleted locally:', err);
    }
  };

  // Clear All Leads
  const clearAllLeads = async () => {
    setLeads([]);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify([]));
    try {
      const snapshot = await getDocs(collection(db, 'leads'));
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      showToast('info', 'Leads Cleared', 'All leads have been removed.');
    } catch (err) {
      console.warn('Error clearing leads:', err);
    }
  };

  // Mark Action Done
  const markActionDone = async (id: string) => {
    const target = leads.find((l) => l.id === id);
    if (!target) return;
    const isNowDone = !target.isCompletedToday;
    await updateLead(id, {
      isCompletedToday: isNowDone,
      completedAt: isNowDone ? new Date().toISOString() : undefined,
    });
    if (isNowDone) {
      showToast('success', 'Task Completed', `Follow-up action for ${target.name} marked done!`);
    }
  };

  // Reschedule due date
  const rescheduleLead = async (id: string, daysOffset: number) => {
    const target = leads.find((l) => l.id === id);
    if (!target) return;
    const baseDate = target.actionDueDate || getTodayDateString();
    const newDueDate = offsetDateString(baseDate, daysOffset);
    await updateLead(id, {
      actionDueDate: newDueDate,
      isCompletedToday: false,
    });
    showToast('info', 'Rescheduled', `Moved deadline for ${target.name} by +${daysOffset} ${daysOffset === 1 ? 'day' : 'days'}.`);
  };

  // Add Custom Source
  const addCustomSource = async (source: string) => {
    const cleanSource = source.trim();
    if (!cleanSource || allSources.includes(cleanSource)) return;
    const updated = [...customSources, cleanSource];
    setCustomSources(updated);
    localStorage.setItem(LOCAL_STORAGE_SOURCES_KEY, JSON.stringify(updated));
    showToast('success', 'Source Added', `Registered custom source "${cleanSource}".`);

    try {
      await setDoc(doc(db, 'userSettings', 'global'), { customSources: updated }, { merge: true });
    } catch (err) {
      console.warn('Settings cloud sync notice:', err);
    }
  };

  // Add Custom Venue
  const addCustomVenue = async (venue: string) => {
    const cleanVenue = venue.trim();
    if (!cleanVenue || allVenues.includes(cleanVenue)) return;
    const updated = [...customVenues, cleanVenue];
    setCustomVenues(updated);
    localStorage.setItem(LOCAL_STORAGE_VENUES_KEY, JSON.stringify(updated));
    showToast('success', 'Venue Added', `Registered custom venue "${cleanVenue}".`);

    try {
      await setDoc(doc(db, 'userSettings', 'global'), { customVenues: updated }, { merge: true });
    } catch (err) {
      console.warn('Settings cloud sync notice:', err);
    }
  };

  // Computed KPI Metrics
  const kpiStats = useMemo(() => {
    const totalLeads = leads.length;
    let convertedWon = 0;
    let inPipeline = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let completedTodayCount = 0;

    leads.forEach((lead) => {
      if (lead.stage === 'Converted') {
        convertedWon++;
      } else if (lead.stage !== 'Redundant') {
        inPipeline++;
      }

      if (lead.isCompletedToday) {
        completedTodayCount++;
      }

      const urgency = getUrgencyStatus(lead.actionDueDate);
      if (urgency === 'today') {
        dueTodayCount++;
      } else if (urgency === 'overdue') {
        overdueCount++;
      } else {
        upcomingCount++;
      }
    });

    const conversionRate = totalLeads > 0 ? Math.round((convertedWon / totalLeads) * 100) : 0;
    const dueTodayOrOverdueCount = dueTodayCount + overdueCount;

    return {
      totalLeads,
      inPipeline,
      convertedWon,
      conversionRate,
      dueTodayOrOverdueCount,
      dueTodayCount,
      overdueCount,
      upcomingCount,
      completedTodayCount,
    };
  }, [leads]);

  return (
    <LeadContext.Provider
      value={{
        leads,
        isCloudConnected,
        customSources,
        customVenues,
        allSources,
        allVenues,
        toasts,
        removeToast,
        showToast,
        addLead,
        updateLead,
        deleteLead,
        clearAllLeads,
        markActionDone,
        rescheduleLead,
        changeStage,
        advanceToNextStage,
        addCustomSource,
        addCustomVenue,
        kpiStats,
      }}
    >
      {children}
    </LeadContext.Provider>
  );
};

export const useLeadContext = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeadContext must be used within a LeadProvider');
  }
  return context;
};
