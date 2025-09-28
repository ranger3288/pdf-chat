import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../utils/theme'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: colors.success,
      bgColor: theme === 'light' ? '#f0fdf4' : '#1a2e1a',
      borderColor: theme === 'light' ? '#bbf7d0' : '#22c55e',
      textColor: theme === 'light' ? '#166534' : '#22c55e'
    },
    error: {
      icon: XCircle,
      iconColor: colors.error,
      bgColor: theme === 'light' ? '#fef2f2' : '#2e1a1a',
      borderColor: theme === 'light' ? '#fecaca' : '#ef4444',
      textColor: theme === 'light' ? '#991b1b' : '#ef4444'
    },
    warning: {
      icon: AlertCircle,
      iconColor: colors.warning,
      bgColor: theme === 'light' ? '#fffbeb' : '#2e2a1a',
      borderColor: theme === 'light' ? '#fed7aa' : '#f59e0b',
      textColor: theme === 'light' ? '#92400e' : '#f59e0b'
    },
    info: {
      icon: AlertCircle,
      iconColor: colors.info,
      bgColor: theme === 'light' ? '#eff6ff' : '#1a1e2e',
      borderColor: theme === 'light' ? '#bfdbfe' : '#3b82f6',
      textColor: theme === 'light' ? '#1e40af' : '#3b82f6'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <div style={{
        maxWidth: '24rem',
        width: '100%',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        pointerEvents: 'auto'
      }}>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              <Icon style={{ height: '1.25rem', width: '1.25rem', color: config.iconColor }} />
            </div>
            <div style={{ marginLeft: '0.75rem', flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: config.textColor,
                margin: 0
              }}>
                {title}
              </p>
              {message && (
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  color: config.textColor,
                  opacity: 0.9,
                  margin: '0.25rem 0 0 0'
                }}>
                  {message}
                </p>
              )}
            </div>
            <div style={{ marginLeft: '1rem', flexShrink: 0, display: 'flex' }}>
              <button
                style={{
                  display: 'inline-flex',
                  color: config.textColor,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem'
                }}
                onClick={handleClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.75'
                  e.currentTarget.style.backgroundColor = colors.hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X style={{ height: '1rem', width: '1rem' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
  }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  )
}
