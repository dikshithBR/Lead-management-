import { UrgencyStatus, PipelineStage } from '../types/lead';

export interface StageProgressionRule {
  targetStage: PipelineStage;
  intervalText: string;
  defaultAction: string;
}

/**
 * Strict sales workflow progression rules:
 * 1. Inquired -> Trial: 1 day
 * 2. Trial -> First Follow-up: 12 hours
 * 3. First Follow-up -> Second Follow-up: 2 days
 * 4. Second Follow-up -> Second Trial: 2 days
 * 5. Second Trial -> Third Follow-up: 12 hours
 * 6. Third Follow-up -> Converted / Call on Custom Date / Redundant
 * 7. Call on Custom Date -> return to pipeline
 */
export const STAGE_PROGRESSION: Record<
  PipelineStage,
  { nextStage: PipelineStage | null; intervalText: string; defaultAction: string }
> = {
  'Completed': {
    nextStage: null,
    intervalText: '3 Days',
    defaultAction: '1st Outreach Reminder: Initial check-in',
  },
  'Inquired': {
    nextStage: 'Trial',
    intervalText: '1 Day',
    defaultAction: 'Conduct Trial Session / Onboarding demonstration',
  },
  'Trial': {
    nextStage: 'First Follow-up',
    intervalText: '1 Day',
    defaultAction: '1st follow-up call after trial (1 day window)',
  },
  'First Follow-up': {
    nextStage: 'Second Follow-up',
    intervalText: '2 Days',
    defaultAction: '2nd follow-up to address questions & discuss package terms (2 days window)',
  },
  'Second Follow-up': {
    nextStage: 'Redundant',
    intervalText: '2 Days',
    defaultAction: '2nd follow-up done. No response after 2 days -> manually push to Redundant',
  },
  'Second Trial': {
    nextStage: 'Third Follow-up',
    intervalText: '1 Day',
    defaultAction: '3rd follow-up call after 2nd trial to review session (1 day)',
  },
  'Third Follow-up': {
    nextStage: 'Fourth Follow-up',
    intervalText: '1 Day',
    defaultAction: '4th follow-up call on package offer (1 day)',
  },
  'Fourth Follow-up': {
    nextStage: 'Redundant',
    intervalText: '2 Days',
    defaultAction: '4th follow-up done. No response after 2 days -> manually push to Redundant',
  },
  'Call on Custom Date': {
    nextStage: 'Fifth Follow-up',
    intervalText: '2 Days',
    defaultAction: 'Scheduled call date reminder. If no response, advance to 5th Follow-up (2 days)',
  },
  'Fifth Follow-up': {
    nextStage: 'Sixth Follow-up',
    intervalText: '1 Day',
    defaultAction: '5th follow-up call after missed custom call (1 day to 6th)',
  },
  'Sixth Follow-up': {
    nextStage: 'Redundant',
    intervalText: '2 Days',
    defaultAction: '6th follow-up done. No response after 2 days -> manually push to Redundant',
  },
  'Converted': {
    nextStage: null,
    intervalText: 'Won',
    defaultAction: 'Client won & successfully onboarded',
  },
  'Redundant': {
    nextStage: null,
    intervalText: 'Closed',
    defaultAction: 'Lead closed or unresponsive',
  },
};

/**
 * Calculates deadline for a target pipeline stage based on strict workflow rules:
 * - Completed: 3 days (initial outreach reminder)
 * - Trial: 1 day
 * - First Follow-up: 1 day window after 1st trial
 * - Second Follow-up: 2 days window if no response
 * - Second Trial: 2 days
 * - Third Follow-up: 1 day window after 2nd trial
 * - Fourth Follow-up: 1 day window after 3rd follow-up
 * - Fifth Follow-up: 2 days window after scheduled custom call
 * - Sixth Follow-up: 1 day window after 5th follow-up
 */
export function calculateTargetStageDeadline(
  targetStage: PipelineStage,
  referenceDate: Date = new Date()
): { dueDateStr: string; note: string; label: string } {
  const todayStr = getTodayDateString(referenceDate);

  switch (targetStage) {
    case 'Completed':
      return {
        dueDateStr: offsetDateString(todayStr, 3),
        note: '1st Outreach Reminder: Initial check-in',
        label: '3 Days',
      };

    case 'Trial':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: 'Trial scheduled / follow-up within 1 day',
        label: '1 Day',
      };

    case 'First Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: '1st Follow-up after trial (1 day window)',
        label: '1 Day',
      };

    case 'Second Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 2),
        note: '2nd Follow-up if no response (2 days window)',
        label: '2 Days',
      };

    case 'Second Trial':
      return {
        dueDateStr: offsetDateString(todayStr, 2),
        note: '2nd trial session scheduled in 2 days',
        label: '2 Days',
      };

    case 'Third Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: '3rd Follow-up after 2nd trial (1 day window)',
        label: '1 Day',
      };

    case 'Fourth Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: '4th Follow-up (1 day window)',
        label: '1 Day',
      };

    case 'Fifth Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 2),
        note: '5th Follow-up after custom call (2 days window)',
        label: '2 Days',
      };

    case 'Sixth Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: '6th Follow-up (1 day window)',
        label: '1 Day',
      };

    case 'Call on Custom Date':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: 'Client requested scheduled call-back',
        label: 'Custom Date',
      };

    case 'Converted':
      return {
        dueDateStr: todayStr,
        note: 'Deal won and confirmed',
        label: 'Won',
      };

    case 'Redundant':
      return {
        dueDateStr: todayStr,
        note: 'Closed without conversion',
        label: 'Closed',
      };

    case 'Inquired':
      return {
        dueDateStr: todayStr,
        note: 'Initial inquiry received',
        label: 'Today',
      };
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add or subtract days from a YYYY-MM-DD string or reference date
 */
export function offsetDateString(baseDateStr: string, daysOffset: number): string {
  const parts = baseDateStr.split('-');
  const base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  base.setDate(base.getDate() + daysOffset);
  return getTodayDateString(base);
}

/**
 * Calculates whether a due date is overdue, today, or upcoming relative to referenceDate
 */
export function getUrgencyStatus(dueDateStr: string, referenceDate: Date = new Date()): UrgencyStatus {
  if (!dueDateStr) return 'upcoming';
  const todayStr = getTodayDateString(referenceDate);

  if (dueDateStr < todayStr) {
    return 'overdue';
  } else if (dueDateStr === todayStr) {
    return 'today';
  } else {
    return 'upcoming';
  }
}

/**
 * Human readable label for deadline
 */
export function formatDueDateLabel(dueDateStr: string, referenceDate: Date = new Date()): {
  text: string;
  subtext: string;
  status: UrgencyStatus;
} {
  if (!dueDateStr) {
    return { text: 'No Date', subtext: '', status: 'upcoming' };
  }

  const status = getUrgencyStatus(dueDateStr, referenceDate);
  const todayStr = getTodayDateString(referenceDate);

  const parts = dueDateStr.split('-');
  const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  const todayParts = todayStr.split('-');
  const today = new Date(parseInt(todayParts[0], 10), parseInt(todayParts[1], 10) - 1, parseInt(todayParts[2], 10));

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${monthNames[due.getMonth()]} ${due.getDate()}, ${due.getFullYear()}`;

  if (diffDays === 0) {
    return { text: 'Due Today', subtext: formattedDate, status: 'today' };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', subtext: formattedDate, status: 'upcoming' };
  } else if (diffDays > 1) {
    return { text: `In ${diffDays} days`, subtext: formattedDate, status: 'upcoming' };
  } else if (diffDays === -1) {
    return { text: '1 day overdue', subtext: formattedDate, status: 'overdue' };
  } else {
    return { text: `${Math.abs(diffDays)} days overdue`, subtext: formattedDate, status: 'overdue' };
  }
}

export type WhatsAppType = 'business' | 'standard';

/**
 * Normalizes phone numbers for WhatsApp:
 * - Strips non-digits
 * - If 11 digits starting with 0 (e.g. 09876543210), converts to 919876543210
 * - If 10 digits (standard Indian mobile without country code), prepends 91
 * - Preserves standard international numbers with existing country codes (e.g. 919876543210, 15551234567)
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  let cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '91' + cleaned.slice(1);
  } else if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Formats a direct WhatsApp or WhatsApp Business link.
 * Targets WhatsApp Business (com.whatsapp.w4b on Android, whatsapp-business:// on iOS, api.whatsapp.com on desktop).
 */
export function formatWhatsAppUrl(
  phoneNumber: string,
  clientName: string,
  venue: string,
  appType: WhatsAppType = 'business'
): string {
  const cleanedDigits = normalizePhoneNumber(phoneNumber);
  const greeting = `Hi ${clientName}, following up regarding your inquiry at ${venue}. How can we assist you today?`;
  const encodedMsg = encodeURIComponent(greeting);

  if (appType === 'business') {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);

      if (isAndroid) {
        // Direct package-targeted Android Intent for WhatsApp Business
        return `intent://send?phone=${cleanedDigits}&text=${encodedMsg}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end;`;
      }

      if (isIOS) {
        return `whatsapp-business://send?phone=${cleanedDigits}&text=${encodedMsg}`;
      }
    }

    // Default universal web / desktop link
    return `https://api.whatsapp.com/send?phone=${cleanedDigits}&text=${encodedMsg}`;
  }

  // Standard Personal WhatsApp
  return `https://wa.me/${cleanedDigits}?text=${encodedMsg}`;
}

/**
 * Universal launcher to reliably open WhatsApp Business on Android, iOS, or Web
 */
export function openWhatsApp(
  phoneNumber: string,
  clientName: string,
  venue: string,
  appType: WhatsAppType = 'business'
): void {
  if (typeof window === 'undefined') return;

  const url = formatWhatsAppUrl(phoneNumber, clientName, venue, appType);
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid || isIOS) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}


