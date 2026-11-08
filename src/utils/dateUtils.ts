import { UrgencyStatus } from '../types/lead';

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

/**
 * Sanitize a phone number for direct WhatsApp link
 */
export function formatWhatsAppUrl(phoneNumber: string, clientName: string, venue: string): string {
  // Strip all non-digit characters
  const cleanedDigits = phoneNumber.replace(/\D/g, '');
  // Default to a professional greeting
  const message = encodeURIComponent(`Hi ${clientName}, following up regarding your inquiry at ${venue}. How can we assist you today?`);
  return `https://wa.me/${cleanedDigits}?text=${message}`;
}
