export type PipelineStage =
  | 'Completed'
  | 'Inquired'
  | 'Trial'
  | 'First Follow-up'
  | 'Second Follow-up'
  | 'Second Trial'
  | 'Third Follow-up'
  | 'Fourth Follow-up'
  | 'Fifth Follow-up'
  | 'Sixth Follow-up'
  | 'Call on Custom Date'
  | 'Converted'
  | 'Redundant';

export const ALL_STAGES: PipelineStage[] = [
  'Completed',
  'Inquired',
  'Trial',
  'First Follow-up',
  'Second Follow-up',
  'Second Trial',
  'Third Follow-up',
  'Fourth Follow-up',
  'Fifth Follow-up',
  'Sixth Follow-up',
  'Call on Custom Date',
  'Converted',
  'Redundant',
];

export interface Lead {
  id: string;
  name: string;
  phone: string;
  stage: PipelineStage;
  nextActionNote: string;
  actionDueDate: string; // YYYY-MM-DD
  leadSource: string;
  venue: string;
  ownerId: string;
  outreachStep?: number; // 1 = 1st reminder (+3d), 2 = 2nd outreach trial offer (+2d), 3 = 3rd trial offer (+2d), 4 = executed awaiting manual Redundant
  isCompletedToday?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyStatus = 'overdue' | 'today' | 'upcoming';

export interface LeadFilters {
  searchQuery: string;
  stage: PipelineStage | 'all';
  source: string | 'all';
  venue: string | 'all';
}

export interface UserCustomSettings {
  customSources: string[];
  customVenues: string[];
}

export const DEFAULT_SOURCES: string[] = [
  'Website Direct',
  'Instagram Ads',
  'Google Search',
  'Client Referral',
  'Walk-in Visit',
  'Facebook Campaign',
  'Corporate Partner',
];

export const DEFAULT_VENUES: string[] = [
  'Downtown Executive Hub',
  'Westside Arena & Lounge',
  'Uptown Creative Studio',
  'Harbor View Pavilion',
  'Northside Fitness & Spa',
];
