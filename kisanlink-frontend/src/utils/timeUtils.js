// src/utils/timeUtils.js - CORRECTED VERSION FOR NEPAL TIME
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000; // UTC+5:45 in milliseconds

// Parse timestamp for Nepal timezone
export const parseNepalTime = (timestamp) => {
  if (!timestamp) return new Date();
  
  let date;
  
  try {
    // If it's a Unix timestamp (number in milliseconds since epoch)
    if (typeof timestamp === 'number') {
      // Unix timestamps are UTC, so add Nepal offset
      date = new Date(timestamp + NEPAL_OFFSET_MS);
    }
    // If it's an ISO string (e.g., "2024-01-03T10:30:00")
    else if (typeof timestamp === 'string' && timestamp.includes('T')) {
      // Check if it already has timezone info
      if (timestamp.endsWith('Z') || timestamp.includes('+') || timestamp.includes('-')) {
        // If it has timezone info, parse it as is (likely UTC)
        date = new Date(timestamp);
        // If it's UTC (ends with Z), add Nepal offset
        if (timestamp.endsWith('Z')) {
          date = new Date(date.getTime() + NEPAL_OFFSET_MS);
        }
      } else {
        // No timezone - assume it's already Nepal time
        date = new Date(timestamp);
      }
    }
    // If it's "YYYY-MM-DD HH:MM:SS" format (common from databases)
    else if (typeof timestamp === 'string') {
      // Convert to ISO format and parse (assume Nepal time)
      const isoString = timestamp.replace(' ', 'T') + '+05:45';
      date = new Date(isoString);
    }
    else {
      date = new Date();
    }
  } catch (error) {
    console.error("Error parsing timestamp:", timestamp, error);
    date = new Date();
  }
  
  return date;
};

// Get current Nepal time
export const getCurrentNepalTime = () => {
  const now = new Date();
  return new Date(now.getTime() + NEPAL_OFFSET_MS);
};

// Format time for messages/orders (relative + absolute)
export const formatMessageTime = (timestamp) => {
  const messageDate = parseNepalTime(timestamp);
  if (isNaN(messageDate.getTime())) return "Just now";
  
  const now = getCurrentNepalTime();
  const diffMs = now - messageDate;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Within last minute
  if (diffSecs < 60) {
    return "Just now";
  }
  
  // Within last hour
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  }
  
  // Today
  if (messageDate.getDate() === now.getDate() && 
      messageDate.getMonth() === now.getMonth() && 
      messageDate.getFullYear() === now.getFullYear()) {
    return `Today ${messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kathmandu'
    })}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.getDate() === yesterday.getDate() && 
      messageDate.getMonth() === yesterday.getMonth() && 
      messageDate.getFullYear() === yesterday.getFullYear()) {
    return `Yesterday ${messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kathmandu'
    })}`;
  }
  
  // Within last 7 days
  if (diffDays < 7) {
    return `${messageDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      timeZone: 'Asia/Kathmandu'
    })} ${messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kathmandu'
    })}`;
  }
  
  // Within same year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return `${messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'Asia/Kathmandu'
    })} ${messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kathmandu'
    })}`;
  }
  
  // Different year
  return `${messageDate.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    timeZone: 'Asia/Kathmandu'
  })} ${messageDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kathmandu'
  })}`;
};

// Simple time format for chat (just time)
export const formatChatTime = (timestamp) => {
  const date = parseNepalTime(timestamp);
  if (isNaN(date.getTime())) return "";
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kathmandu'
  });
};

// Compact format for conversation lists
export const formatConversationTime = (timestamp) => {
  const messageDate = parseNepalTime(timestamp);
  if (isNaN(messageDate.getTime())) return "Just now";
  
  const now = getCurrentNepalTime();
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Within last hour
  if (diffMins < 60) {
    if (diffMins < 1) return "Just now";
    return `${diffMins}m ago`;
  }
  
  // Today
  if (messageDate.getDate() === now.getDate() && 
      messageDate.getMonth() === now.getMonth() && 
      messageDate.getFullYear() === now.getFullYear()) {
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.getDate() === yesterday.getDate() && 
      messageDate.getMonth() === yesterday.getMonth() && 
      messageDate.getFullYear() === yesterday.getFullYear()) {
    return "Yesterday";
  }
  
  // Within last week
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  // Return date
  return messageDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'Asia/Kathmandu'
  });
};

// Format for notifications
export const formatNotificationTime = (timestamp) => {
  const date = parseNepalTime(timestamp);
  if (isNaN(date.getTime())) return "Just now";
  
  const now = getCurrentNepalTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kathmandu'
  });
};

// Format date only (without time)
export const formatNepaliDate = (timestamp) => {
  const date = parseNepalTime(timestamp);
  if (isNaN(date.getTime())) return "";
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kathmandu'
  });
};

// Format time only (without date)
export const formatNepaliTime = (timestamp) => {
  const date = parseNepalTime(timestamp);
  if (isNaN(date.getTime())) return "";
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kathmandu'
  });
};