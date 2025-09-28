export const lightTheme = {
  // Backgrounds
  primary: '#ffffff',
  secondary: '#f5f5f5',
  tertiary: '#f8f9fa',
  
  // Text
  textPrimary: '#333333',
  textSecondary: '#666666',
  textMuted: '#9ca3af',
  
  // Borders
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  
  // Interactive
  hover: '#f8f9fa',
  active: '#e9ecef',
  
  // Status colors
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  
  // Shadows
  shadow: '0 2px 4px rgba(0,0,0,0.1)',
  shadowLg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  
  // Chat messages
  userMessage: '#4285f4',
  assistantMessage: '#ffffff',
  messageText: '#333333',
  messageTextUser: '#ffffff'
}

export const darkTheme = {
  // Backgrounds - Modern off-black
  primary: '#1a1a1a',      // Main background
  secondary: '#2d2d2d',    // Card/panel background
  tertiary: '#3a3a3a',     // Hover states
  
  // Text
  textPrimary: '#e5e5e5',  // Primary text
  textSecondary: '#b3b3b3', // Secondary text
  textMuted: '#808080',    // Muted text
  
  // Borders
  border: '#404040',       // Main borders
  borderLight: '#333333',  // Light borders
  
  // Interactive
  hover: '#333333',        // Hover states
  active: '#404040',       // Active states
  
  // Status colors (slightly adjusted for dark mode)
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Shadows
  shadow: '0 2px 4px rgba(0,0,0,0.3)',
  shadowLg: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.2)',
  
  // Chat messages
  userMessage: '#4285f4',  // Keep blue for user messages
  assistantMessage: '#2d2d2d', // Dark background for assistant
  messageText: '#e5e5e5',  // Light text for assistant
  messageTextUser: '#ffffff' // White text for user
}

export function getThemeColors(theme: 'light' | 'dark') {
  return theme === 'light' ? lightTheme : darkTheme
}
