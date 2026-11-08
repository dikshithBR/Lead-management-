import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
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
import { generate25SampleLeads } from '../utils/sampleData';
import { getTodayDateString, offsetDateString, getUrgencyStatus } from '../utils/dateUtils';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface LeadContextType {
  leads: Lead[];
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

  // Fast Actions
  markActionDone: (id: string) => Promise<void>;
  rescheduleLead: (id: string, daysOffset: number) => Promise<void>;
  changeStage: (id: string, newStage: PipelineStage) => Promise<void>;

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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return generate25SampleLeads('shared-user');
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
        if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
          // Cloud is empty on first run: seed 25 realistic sample leads to Firestore
          const initialSamples = generate25SampleLeads('shared-user');
          try {
            const batch = writeBatch(db);
            initialSamples.forEach((lead) => {
              batch.set(doc(db, 'leads', lead.id), lead);
            });
            await batch.commit();
          } catch (seedErr) {
            console.warn('Initial cloud seed notice:', seedErr);
          }
          return;
        }

        const remoteLeads: Lead[] = [];
        snapshot.forEach((docSnap) => {
          remoteLeads.push(docSnap.data() as Lead);
        });

        // Sort by actionDueDate ascending
        remoteLeads.sort((a, b) => a.actionDueDate.localeCompare(b.actionDueDate));
        setLeads(remoteLeads);
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(remoteLeads));
      },
      (error) => {
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

  // Change Stage
  const changeStage = async (id: string, newStage: PipelineStage) => {
    await updateLead(id, { stage: newStage });
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
        markActionDone,
        rescheduleLead,
        changeStage,
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
