import { Lead, PipelineStage, DEFAULT_SOURCES, DEFAULT_VENUES } from '../types/lead';
import { getTodayDateString, offsetDateString } from './dateUtils';

interface LeadSeedTemplate {
  name: string;
  phone: string;
  stage: PipelineStage;
  nextActionNote: string;
  daysOffset: number; // relative to today: negative = overdue, 0 = today, positive = upcoming
  leadSource: string;
  venue: string;
  isCompletedToday?: boolean;
}

export function generate25SampleLeads(ownerId: string, referenceDate: Date = new Date()): Lead[] {
  const todayStr = getTodayDateString(referenceDate);

  const templates: LeadSeedTemplate[] = [
    // 1. Inquired (4 leads)
    {
      name: 'Sophia Martinez',
      phone: '+1 (415) 892-1024',
      stage: 'Inquired',
      nextActionNote: 'Send introductory welcome brochure and schedule facility walkthrough.',
      daysOffset: 0, // DUE TODAY
      leadSource: DEFAULT_SOURCES[0], // Website Direct
      venue: DEFAULT_VENUES[0], // Downtown Executive Hub
    },
    {
      name: 'Alexander Wright',
      phone: '+1 (212) 555-0143',
      stage: 'Inquired',
      nextActionNote: 'Call back to qualify team size and corporate workshop date availability.',
      daysOffset: -1, // OVERDUE
      leadSource: DEFAULT_SOURCES[1], // Instagram Ads
      venue: DEFAULT_VENUES[1], // Westside Arena & Lounge
    },
    {
      name: 'Priya Patel',
      phone: '+1 (650) 412-8871',
      stage: 'Inquired',
      nextActionNote: 'Answer inquiry regarding weekend private studio rental options.',
      daysOffset: 1, // UPCOMING
      leadSource: DEFAULT_SOURCES[2], // Google Search
      venue: DEFAULT_VENUES[2], // Uptown Creative Studio
    },
    {
      name: 'Marcus Vance',
      phone: '+1 (312) 789-2234',
      stage: 'Inquired',
      nextActionNote: 'Email parking and accessibility details for initial consultation.',
      daysOffset: 3, // UPCOMING
      leadSource: DEFAULT_SOURCES[4], // Walk-in Visit
      venue: DEFAULT_VENUES[3], // Harbor View Pavilion
    },

    // 2. Trial (4 leads)
    {
      name: 'Elena Rostova',
      phone: '+1 (206) 555-7890',
      stage: 'Trial',
      nextActionNote: 'Prepare VIP trial access pass and assign dedicated onboarding guide.',
      daysOffset: 0, // DUE TODAY
      leadSource: DEFAULT_SOURCES[0],
      venue: DEFAULT_VENUES[0],
    },
    {
      name: 'Liam O’Connor',
      phone: '+1 (617) 555-3412',
      stage: 'Trial',
      nextActionNote: 'Confirm attendance for Thursday morning 9:00 AM trial session.',
      daysOffset: -2, // OVERDUE
      leadSource: DEFAULT_SOURCES[3], // Client Referral
      venue: DEFAULT_VENUES[4], // Northside Fitness & Spa
    },
    {
      name: 'Chloe Dupont',
      phone: '+1 (305) 555-8821',
      stage: 'Trial',
      nextActionNote: 'Send reminder SMS with locker codes and venue directions.',
      daysOffset: 2, // UPCOMING
      leadSource: DEFAULT_SOURCES[1],
      venue: DEFAULT_VENUES[1],
    },
    {
      name: 'David Kim',
      phone: '+1 (408) 555-9011',
      stage: 'Trial',
      nextActionNote: 'Set up audio/visual demonstration equipment for studio trial run.',
      daysOffset: 4, // UPCOMING
      leadSource: DEFAULT_SOURCES[2],
      venue: DEFAULT_VENUES[2],
    },

    // 3. First Follow-up (4 leads)
    {
      name: 'Fatima Al-Sayed',
      phone: '+1 (713) 555-4432',
      stage: 'First Follow-up',
      nextActionNote: 'Review feedback from trial session and answer questions on annual contract.',
      daysOffset: 0, // DUE TODAY
      leadSource: DEFAULT_SOURCES[3],
      venue: DEFAULT_VENUES[0],
    },
    {
      name: 'Lucas Silva',
      phone: '+1 (303) 555-6678',
      stage: 'First Follow-up',
      nextActionNote: 'Follow up on the tailored event proposal sent via email on Monday.',
      daysOffset: -3, // OVERDUE
      leadSource: DEFAULT_SOURCES[5], // Facebook Campaign
      venue: DEFAULT_VENUES[3],
    },
    {
      name: 'Maya Lin',
      phone: '+1 (503) 555-1190',
      stage: 'First Follow-up',
      nextActionNote: 'Check in via WhatsApp to see if team approved event dates.',
      daysOffset: 1, // UPCOMING
      leadSource: DEFAULT_SOURCES[0],
      venue: DEFAULT_VENUES[2],
    },
    {
      name: 'Jordan Hayes',
      phone: '+1 (619) 555-8234',
      stage: 'First Follow-up',
      nextActionNote: 'Present comparison sheet of Executive package vs Standard tier.',
      daysOffset: 5, // UPCOMING
      leadSource: DEFAULT_SOURCES[6], // Corporate Partner
      venue: DEFAULT_VENUES[1],
    },

    // 4. Second Follow-up (4 leads)
    {
      name: 'Noah Bennett',
      phone: '+1 (404) 555-7761',
      stage: 'Second Follow-up',
      nextActionNote: 'Offer limited-time complimentary catering upgrade expiring Friday.',
      daysOffset: 0, // DUE TODAY
      leadSource: DEFAULT_SOURCES[2],
      venue: DEFAULT_VENUES[4],
    },
    {
      name: 'Carlos Mendez',
      phone: '+1 (214) 555-9988',
      stage: 'Second Follow-up',
      nextActionNote: 'Critical decision deadline check: client needs to lock room dates.',
      daysOffset: -4, // OVERDUE
      leadSource: DEFAULT_SOURCES[1],
      venue: DEFAULT_VENUES[3],
    },
    {
      name: 'Emily Watson',
      phone: '+1 (312) 555-2244',
      stage: 'Second Follow-up',
      nextActionNote: 'Connect with head of human resources to finalize group terms.',
      daysOffset: 2, // UPCOMING
      leadSource: DEFAULT_SOURCES[6],
      venue: DEFAULT_VENUES[0],
    },
    {
      name: 'Tariq Mansour',
      phone: '+1 (602) 555-3310',
      stage: 'Second Follow-up',
      nextActionNote: 'Follow up on catering requirements and custom menu signoff.',
      daysOffset: -1, // OVERDUE
      leadSource: DEFAULT_SOURCES[4],
      venue: DEFAULT_VENUES[1],
    },

    // 5. Second Trial (3 leads)
    {
      name: 'Olivia Chen',
      phone: '+1 (415) 555-6677',
      stage: 'Second Trial',
      nextActionNote: 'Second complimentary trial scheduled with senior leadership team.',
      daysOffset: 0, // DUE TODAY
      leadSource: DEFAULT_SOURCES[0],
      venue: DEFAULT_VENUES[2],
    },
    {
      name: 'Ethan Ross',
      phone: '+1 (702) 555-8833',
      stage: 'Second Trial',
      nextActionNote: 'Walkthrough of stage lighting & sound staging for live demo.',
      daysOffset: -2, // OVERDUE
      leadSource: DEFAULT_SOURCES[3],
      venue: DEFAULT_VENUES[3],
    },
    {
      name: 'Harper Scott',
      phone: '+1 (917) 555-4422',
      stage: 'Second Trial',
      nextActionNote: 'Review secondary session feedback before sending agreement.',
      daysOffset: 3, // UPCOMING
      leadSource: DEFAULT_SOURCES[5],
      venue: DEFAULT_VENUES[0],
    },

    // 6. Call on Custom Date (2 leads)
    {
      name: 'Julian Vance',
      phone: '+1 (512) 555-8910',
      stage: 'Call on Custom Date',
      nextActionNote: 'Client requested call back on this date after quarterly board review.',
      daysOffset: 1,
      leadSource: DEFAULT_SOURCES[0],
      venue: DEFAULT_VENUES[1],
    },
    {
      name: 'Seraphina Dubois',
      phone: '+1 (305) 555-7744',
      stage: 'Call on Custom Date',
      nextActionNote: 'Client asked to call on this date after returning from regional conference.',
      daysOffset: 3,
      leadSource: DEFAULT_SOURCES[2],
      venue: DEFAULT_VENUES[3],
    },

    // 7. Converted (3 leads - Celebrated Wins)
    {
      name: 'Isabella Rivera',
      phone: '+1 (818) 555-3321',
      stage: 'Converted',
      nextActionNote: 'Completed onboarding! Welcome packet sent and portal activated.',
      daysOffset: 0, // DUE TODAY
      leadSource: DEFAULT_SOURCES[3],
      venue: DEFAULT_VENUES[1],
      isCompletedToday: true,
    },
    {
      name: 'Daniel Zhang',
      phone: '+1 (206) 555-9087',
      stage: 'Converted',
      nextActionNote: 'Annual agreement signed and official onboarding initiated.',
      daysOffset: -5,
      leadSource: DEFAULT_SOURCES[6],
      venue: DEFAULT_VENUES[0],
      isCompletedToday: true,
    },
    {
      name: 'Hannah Schmidt',
      phone: '+1 (312) 555-6543',
      stage: 'Converted',
      nextActionNote: 'Agreement signed. Quarterly venue reservation confirmed.',
      daysOffset: -3,
      leadSource: DEFAULT_SOURCES[2],
      venue: DEFAULT_VENUES[4],
      isCompletedToday: true,
    },

    // 7. Redundant (3 leads)
    {
      name: 'Victor Gomez',
      phone: '+1 (702) 555-1239',
      stage: 'Redundant',
      nextActionNote: 'Client postponed expansion to next fiscal year. Tagged for Q3 check-in.',
      daysOffset: 14,
      leadSource: DEFAULT_SOURCES[1],
      venue: DEFAULT_VENUES[3],
    },
    {
      name: 'Zoe Robinson',
      phone: '+1 (415) 555-9876',
      stage: 'Redundant',
      nextActionNote: 'Inquiry paused due to restructuring. Keep in nurture email sequence.',
      daysOffset: -8,
      leadSource: DEFAULT_SOURCES[0],
      venue: DEFAULT_VENUES[2],
    },
    {
      name: 'Samuel Adebayo',
      phone: '+1 (212) 555-7711',
      stage: 'Redundant',
      nextActionNote: 'Duplicate inquiry merged; non-responsive after 4 attempts.',
      daysOffset: -10,
      leadSource: DEFAULT_SOURCES[5],
      venue: DEFAULT_VENUES[1],
    },
  ];

  return templates.map((tmpl, index) => {
    const id = `sample-lead-${Date.now()}-${index + 1}`;
    const actionDueDate = offsetDateString(todayStr, tmpl.daysOffset);
    const createdAt = new Date(referenceDate.getTime() - (index + 2) * 86400000).toISOString();
    const updatedAt = new Date(referenceDate.getTime() - index * 3600000).toISOString();

    return {
      id,
      name: tmpl.name,
      phone: tmpl.phone,
      stage: tmpl.stage,
      nextActionNote: tmpl.nextActionNote,
      actionDueDate,
      leadSource: tmpl.leadSource,
      venue: tmpl.venue,
      ownerId,
      isCompletedToday: tmpl.isCompletedToday || false,
      completedAt: tmpl.isCompletedToday ? new Date().toISOString() : undefined,
      createdAt,
      updatedAt,
    };
  });
}
