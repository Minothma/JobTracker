export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startTime: string | Date;
  durationMinutes?: number;
}

/**
 * Format a Date to UTC ISO string format required by iCalendar and Google Calendar (YYYYMMDDTHHmmssZ)
 */
export function formatToCalendarDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return d
    .toISOString()
    .replace(/-|:|\.\d+/g, '')
    .slice(0, 15) + 'Z';
}

/**
 * Generate direct Google Calendar web event creation URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = new Date(event.startTime);
  const durationMs = (event.durationMinutes || 60) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);

  const startFormatted = formatToCalendarDate(startDate);
  const endFormatted = formatToCalendarDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startFormatted}/${endFormatted}`,
    details: event.description,
    location: event.location || 'Online / Video Call',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate and trigger download of a standard .ics iCalendar file (compatible with Outlook, Apple Calendar, Google Calendar)
 */
export function downloadIcsFile(event: CalendarEvent): void {
  const startDate = new Date(event.startTime);
  const durationMs = (event.durationMinutes || 60) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);

  const startFormatted = formatToCalendarDate(startDate);
  const endFormatted = formatToCalendarDate(endDate);
  const nowFormatted = formatToCalendarDate(new Date());

  const uid = `jobtracker-interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@jobtracker.local`;

  // Escape special characters in description and summary for iCalendar
  const cleanSummary = event.title.replace(/[\n\r]/g, ' ');
  const cleanDescription = event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const cleanLocation = (event.location || 'Online / Video Call').replace(/[\n\r]/g, ' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Job Application Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const safeFilename = event.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
  link.setAttribute('download', `${safeFilename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
