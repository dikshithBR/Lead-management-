import { Lead } from '../types/lead';

export function exportLeadsToCSV(leads: Lead[], filename = 'leadflow_leads_export.csv') {
  if (leads.length === 0) {
    return;
  }

  const headers = [
    'Lead Name',
    'Phone Number',
    'Stage',
    'Next Action Due Date',
    'Next Action Note',
    'Lead Source',
    'Venue',
    'Created At',
  ];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead) => [
    escapeCSV(lead.name),
    escapeCSV(lead.phone),
    escapeCSV(lead.stage),
    escapeCSV(lead.actionDueDate),
    escapeCSV(lead.nextActionNote),
    escapeCSV(lead.leadSource),
    escapeCSV(lead.venue),
    escapeCSV(lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
