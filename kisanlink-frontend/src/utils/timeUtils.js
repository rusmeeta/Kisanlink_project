// src/utils/timeUtils.js

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "Just now";
  
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  // Check if timestamp is valid
  if (isNaN(messageDate.getTime())) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid time";
  }
  
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
  if (messageDate.toDateString() === now.toDateString()) {
    return `Today ${messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  }
  
  // Within last 7 days
  if (diffDays < 7) {
    return `${messageDate.toLocaleDateString('en-US', { 
      weekday: 'short' 
    })} ${messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  }
  
  // Within same year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return `${messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} ${messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  }
  
  // Different year
  return `${messageDate.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  })} ${messageDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}`;
};

export const formatChatTime = (timestamp) => {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "";
  }
  
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatConversationTime = (timestamp) => {
  if (!timestamp) return "Just now";
  
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  if (isNaN(messageDate.getTime())) {
    return "Just now";
  }
  
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
  if (messageDate.toDateString() === now.toDateString()) {
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // Within last week
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  // Return date
  return messageDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};