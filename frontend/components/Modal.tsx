import React from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../utils/theme'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  
  if (!isOpen) return null

  const sizeStyles = {
    sm: { maxWidth: '28rem' },
    md: { maxWidth: '32rem' },
    lg: { maxWidth: '42rem' }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      overflowY: 'auto'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          transition: 'opacity 0.2s'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          ...sizeStyles[size],
          transform: 'translateY(0)',
          overflow: 'hidden',
          borderRadius: '0.5rem',
          backgroundColor: colors.primary,
          boxShadow: colors.shadowLg,
          transition: 'all 0.2s'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.border}`,
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: colors.textPrimary,
              margin: 0
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                borderRadius: '0.375rem',
                padding: '0.25rem',
                color: colors.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hover
                e.currentTarget.style.color = colors.textSecondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = colors.textMuted
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div style={{
            padding: '1.5rem'
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
