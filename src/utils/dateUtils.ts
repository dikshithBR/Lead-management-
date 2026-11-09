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
  'Inquired': {
    nextStage: 'Trial',
    intervalText: '1 Day',
    defaultAction: 'Conduct Trial Session / Onboarding demonstration',
  },
  'Trial': {
    nextStage: 'First Follow-up',
    intervalText: '12 Hours',
    defaultAction: 'First follow-up call to check trial experience & feedback',
  },
  'First Follow-up': {
    nextStage: 'Second Follow-up',
    intervalText: '2 Days',
    defaultAction: 'Second follow-up to address questions & discuss package terms',
  },
  'Second Follow-up': {
    nextStage: 'Second Trial',
    intervalText: '2 Days',
    defaultAction: 'Second trial / deep dive session booking',
  },
  'Second Trial': {
    nextStage: 'Third Follow-up',
    intervalText: '12 Hours',
    defaultAction: 'Third follow-up call after second trial to close membership',
  },
  'Third Follow-up': {
    nextStage: 'Converted',
    intervalText: 'Final Closing',
    defaultAction: 'Final closing review & contract sign-off',
  },
  'Call on Custom Date': {
    nextStage: null,
    intervalText: 'Custom Date',
    defaultAction: 'Client requested scheduled call-back',
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
 * - Trial: 1 day
 * - First Follow-up: 12 hours (today evening if before 1 PM, else tomorrow morning)
 * - Second Follow-up: 2 days
 * - Second Trial: 2 days
 * - Third Follow-up: 12 hours (today evening if before 1 PM, else tomorrow morning)
 */
export function calculateTargetStageDeadline(
  targetStage: PipelineStage,
  referenceDate: Date = new Date()
): { dueDateStr: string; note: string; label: string } {
  const todayStr = getTodayDateString(referenceDate);
  const currentHour = referenceDate.getHours();

  switch (targetStage) {
    case 'Trial':
      return {
        dueDateStr: offsetDateString(todayStr, 1),
        note: 'Trial scheduled / follow-up within 1 day',
        label: '1 Day',
      };

    case 'First Follow-up':
      if (currentHour < 13) {
        // Earlier than 1 PM -> 12 hours is today evening
        return {
          dueDateStr: todayStr,
          note: '1st follow-up within 12h (Today evening)',
          label: '12 Hours (Today)',
        };
      } else {
        // After 1 PM -> 12 hours is tomorrow morning
        return {
          dueDateStr: offsetDateString(todayStr, 1),
          note: '1st follow-up within 12h (Tomorrow morning)',
          label: '12 Hours (Tomorrow)',
        };
      }

    case 'Second Follow-up':
      return {
        dueDateStr: offsetDateString(todayStr, 2),
        note: '2nd follow-up scheduled in 2 days',
        label: '2 Days',
      };

    case 'Second Trial':
      return {
        dueDateStr: offsetDateString(todayStr, 2),
        note: '2nd trial session scheduled in 2 days',
        label: '2 Days',
      };

    case 'Third Follow-up':
      if (currentHour < 13) {
        return {
          dueDateStr: todayStr,
          note: '3rd follow-up within 12h (Today evening)',
          label: '12 Hours (Today)',
        };
      } else {
        return {
          dueDateStr: offsetDateString(todayStr, 1),
          note: '3rd follow-up within 12h (Tomorrow morning)',
          label: '12 Hours (Tomorrow)',
        };
      }

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
    default:
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
 * Formats a direct WhatsApp or WhatsApp Business link.
 * Defaults to WhatsApp Business (`com.whatsapp.w4b` on Android, `whatsapp-business://` on iOS, and web fallback).
 */
export function formatWhatsAppUrl(
  phoneNumber: string,
  clientName: string,
  venue: string,
  appType: WhatsAppType = 'business'
): string {
  const cleanedDigits = phoneNumber.replace(/\D/g, '');
  const greeting = `Hi ${clientName}, following up regarding your inquiry at ${venue}. How can we assist you today?`;
  const encodedMsg = encodeURIComponent(greeting);

  if (appType === 'business') {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);

      if (isAndroid) {
        // Explicitly target WhatsApp Business package on Android
        const fallback = encodeURIComponent(`https://api.whatsapp.com/send?phone=${cleanedDigits}&text=${encodedMsg}`);
        return `intent://send?phone=${cleanedDigits}&text=${encodedMsg}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${fallback};end;`;
      }

      if (isIOS) {
        return `whatsapp-business://send?phone=${cleanedDigits}&text=${encodedMsg}`;
      }
    }

    // Default universal link for desktop/other
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

  const cleanedDigits = phoneNumber.replace(/\D/g, '');
  const greeting = `Hi ${clientName}, following up regarding your inquiry at ${venue}. How can we assist you today?`;
  const encodedMsg = encodeURIComponent(greeting);

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (appType === 'business') {
    if (isAndroid) {
      // Force Android OS to launch WhatsApp Business package (com.whatsapp.w4b)
      const fallbackUrl = encodeURIComponent(`https://api.whatsapp.com/send?phone=${cleanedDigits}&text=${encodedMsg}`);
      window.location.href = `intent://send?phone=${cleanedDigits}&text=${encodedMsg}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${fallbackUrl};end;`;
      return;
    }

    if (isIOS) {
      // Attempt iOS WhatsApp Business custom URL scheme
      const fallbackUrl = `https://api.whatsapp.com/send?phone=${cleanedDigits}&text=${encodedMsg}`;
      const businessUrl = `whatsapp-business://send?phone=${cleanedDigits}&text=${encodedMsg}`;

      const start = Date.now();
      window.location.href = businessUrl;

      setTimeout(() => {
        // If app switch didn't blur page within 1.5s, open fallback
        if (Date.now() - start < 2200) {
          window.location.href = fallbackUrl;
        }
      }, 1500);
      return;
    }

    // Desktop: open WhatsApp Web
    window.open(`https://web.whatsapp.com/send?phone=${cleanedDigits}&text=${encodedMsg}`, '_blank', 'noopener,noreferrer');
    return;
  }

  // Standard WhatsApp
  window.open(`https://wa.me/${cleanedDigits}?text=${encodedMsg}`, '_blank', 'noopener,noreferrer');
}

