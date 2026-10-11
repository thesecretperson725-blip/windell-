import { SystemSettings, AttendanceStatus } from '../types/attendance';

export const padZero = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

export const formatDateToWords = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const months = [
      'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
      'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'
    ];
    return `${months[month - 1]} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatTime12Hour = (hours: number, minutes: number): string => {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${padZero(h12)}:${padZero(minutes)} ${ampm}`;
};

export const time24To12 = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  return formatTime12Hour(h, m);
};

export const formatAsOfDate = (dateObj: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayName = days[dateObj.getDay()];
  const dayNum = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = padZero(dateObj.getHours());
  const minutes = padZero(dateObj.getMinutes());
  return `as of ${dayName}, ${dayNum} ${monthName} ${year}, ${hours}:${minutes}`;
};

export const getCurrentEffectiveDateTime = (settings: SystemSettings) => {
  if (settings.useCustomDateTime && settings.customDate && settings.customTime) {
    const [year, month, day] = settings.customDate.split('-').map(Number);
    const [hours, minutes] = settings.customTime.split(':').map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0);
    const dateStr = settings.customDate;
    const timeStr24 = `${padZero(hours)}:${padZero(minutes)}`;
    const timeStr12 = formatTime12Hour(hours, minutes);
    const fullDisplayDate = formatDateToWords(dateStr);
    const asOfDateStr = formatAsOfDate(dateObj);
    return {
      dateObj,
      dateStr,
      timeStr24,
      timeStr12,
      fullDisplayDate,
      asOfDateStr,
      isCustom: true,
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const dateStr = `${year}-${padZero(month)}-${padZero(day)}`;
  const timeStr24 = `${padZero(hours)}:${padZero(minutes)}`;
  const timeStr12 = formatTime12Hour(hours, minutes);
  const fullDisplayDate = formatDateToWords(dateStr);
  const asOfDateStr = formatAsOfDate(now);

  return {
    dateObj: now,
    dateStr,
    timeStr24,
    timeStr12,
    fullDisplayDate,
    asOfDateStr,
    isCustom: false,
  };
};

export const determineAttendanceStatus = (
  timeIn24: string,
  cutoff24: string
): AttendanceStatus => {
  const [inHours, inMins] = timeIn24.split(':').map(Number);
  const [cutHours, cutMins] = cutoff24.split(':').map(Number);

  const inTotalMins = inHours * 60 + inMins;
  const cutTotalMins = cutHours * 60 + cutMins;

  if (inTotalMins <= cutTotalMins) {
    return 'Present';
  } else {
    return 'Late';
  }
};
