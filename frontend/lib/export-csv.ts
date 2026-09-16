import { Application } from './types';

/**
 * Escapes fields according to RFC-4180 (wrap in quotes if contains comma, quote, or newline)
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates and triggers download of applications as CSV file
 */
export function exportApplicationsToCsv(applications: Application[], filenamePrefix: string = 'job-applications'): void {
  const headers = [
    'Company Name',
    'Role Title',
    'Status',
    'Applied Date',
    'Job Posting URL',
    'Resume Version',
    'Interviews Scheduled',
    'Notes Logged',
    'Created At',
  ];

  const rows = applications.map((app) => [
    escapeCsvCell(app.company_name),
    escapeCsvCell(app.role_title),
    escapeCsvCell(app.status),
    escapeCsvCell(app.applied_date ? app.applied_date.split('T')[0] : ''),
    escapeCsvCell(app.job_posting_url || ''),
    escapeCsvCell(app.resumes?.version_label || 'None'),
    escapeCsvCell(app._count?.interviews || app.interviews?.length || 0),
    escapeCsvCell(app._count?.notes || app.notes?.length || 0),
    escapeCsvCell(app.created_at ? app.created_at.split('T')[0] : ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}-${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
