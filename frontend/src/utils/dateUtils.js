import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Convert UTC date and time back to local timezone for display
export const convertUTCToLocal = (utcDate, utcTime) => {
  try {
    // Create UTC datetime string
    const utcDateTimeString = `${utcDate}T${utcTime}:00Z`;
    const utcDateTime = dayjs.utc(utcDateTimeString);
    
    // Convert to local timezone (America/New_York)
    const localDateTime = utcDateTime.tz(dayjs.tz.guess());
    
    return {
      date: localDateTime.format('YYYY-MM-DD'),
      time: localDateTime.format('HH:mm'),
      fullDateTime: localDateTime,
      displayDate: localDateTime.format('ddd, MMM D, YYYY'),
      displayTime: localDateTime.format('h:mm A'),
      displayDateTime: localDateTime.format('ddd, MMM D, YYYY h:mm A')
    };
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    // Fallback to original values if conversion fails
    return {
      date: utcDate,
      time: utcTime,
      displayDate: utcDate,
      displayTime: utcTime,
      displayDateTime: `${utcDate} ${utcTime}`
    };
  }
};

// Convert local date and time to UTC for backend submission
export const convertLocalToUTC = (localDate, localTime) => {
  try {
    // Create local datetime
    const localDateTime = dayjs.tz(`${localDate}T${localTime}:00`, dayjs.tz.guess());
    
    // Convert to UTC
    const utcDateTime = localDateTime.utc();
    
    return {
      date: utcDateTime.format('YYYY-MM-DD'),
      time: utcDateTime.format('HH:mm'),
      fullDateTime: utcDateTime
    };
  } catch (error) {
    console.error('Error converting local to UTC time:', error);
    // Fallback to original values if conversion fails
    return {
      date: localDate,
      time: localTime
    };
  }
};

// Check if an event is in the past using UTC comparison
export const isEventInPast = (utcDate, utcTime) => {
  try {
    const utcDateTimeString = `${utcDate}T${utcTime}:00Z`;
    const eventDateTime = dayjs.utc(utcDateTimeString);
    const now = dayjs.utc();
    
    return eventDateTime.isBefore(now);
  } catch (error) {
    console.error('Error checking if event is in past:', error);
    return false;
  }
};

// Get event status based on UTC times
export const getEventStatus = (utcDate, utcStartTime, utcEndTime, status = 'upcoming') => {
  if (status === 'canceled') return 'canceled';
  
  try {
    const now = dayjs.utc();
    const startDateTime = dayjs.utc(`${utcDate}T${utcStartTime}:00Z`);
    const endDateTime = dayjs.utc(`${utcDate}T${utcEndTime}:00Z`);
    
    if (now.isBefore(startDateTime)) {
      return 'upcoming';
    } else if (now.isAfter(startDateTime) && now.isBefore(endDateTime)) {
      return 'live';
    } else if (now.isAfter(endDateTime)) {
      return 'completed';
    }
    return 'unknown';
  } catch (error) {
    console.error('Error getting event status:', error);
    return 'unknown';
  }
}; 