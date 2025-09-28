import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../utils/theme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const colors = getThemeColors(theme)

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '0.5rem',
        backgroundColor: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '0.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        color: colors.textPrimary
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.hover
        e.currentTarget.style.borderColor = colors.textSecondary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = colors.border
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
