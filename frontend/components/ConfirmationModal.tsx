import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../utils/theme'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  isLoading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmationModalProps) {
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  
  const handleConfirm = () => {
    onConfirm()
  }

  const iconColor = variant === 'danger' ? colors.error : colors.warning
  const buttonColor = variant === 'danger' ? colors.error : colors.warning
  const buttonHoverColor = variant === 'danger' ? '#b91c1c' : '#b45309'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Icon and Message */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ flexShrink: 0, color: iconColor }}>
            {variant === 'danger' ? (
              <Trash2 size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '0.875rem',
              color: colors.textPrimary,
              lineHeight: '1.6',
              margin: 0
            }}>
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          paddingTop: '1rem'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: colors.textPrimary,
              backgroundColor: colors.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.375rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = colors.hover
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = colors.primary
              }
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white',
              backgroundColor: buttonColor,
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = buttonHoverColor
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = buttonColor
              }
            }}
          >
            {isLoading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
