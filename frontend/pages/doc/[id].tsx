import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { MessageSquare, Plus, ArrowLeft, Trash2 } from 'lucide-react'
import ConfirmationModal from '../../components/ConfirmationModal'
import { ToastContainer } from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { useTheme } from '../../contexts/ThemeContext'
import { getThemeColors } from '../../utils/theme'

interface Chat {
  id: string
  title: string
  created_at: string
}

export default function DocumentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  const { id: documentId } = router.query
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Load chats when document ID is available
  useEffect(() => {
    if (documentId && session) {
      loadChats()
    }
  }, [documentId, session])

  async function loadChats() {
    try {
      const response = await axios.get(`/api/proxy-backend/documents/${documentId}/chats`)
      setChats(response.data)
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  }

  async function createChat() {
    if (!newChatTitle.trim()) return
    
    setLoading(true)
    try {
      const response = await axios.post('/api/proxy-backend/chats', {
        document_id: documentId,
        title: newChatTitle
      })
      
      setChats([...chats, response.data])
      setNewChatTitle('')
      
      // Navigate to the new chat
      router.push(`/chat/${response.data.id}`)
    } catch (error: any) {
      console.error('Failed to create chat:', error)
      showError('Failed to create chat', error.response?.data?.detail || error.message)
    } finally {
      setLoading(false)
    }
  }

  function goToChat(chatId: string) {
    router.push(`/chat/${chatId}`)
  }

  function handleDeleteClick(chatId: string, chatTitle: string) {
    setChatToDelete({ id: chatId, title: chatTitle })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    if (!chatToDelete) return
    
    setIsDeleting(true)
    try {
      await axios.delete(`/api/proxy-backend/chats/${chatToDelete.id}`)
      loadChats() // Refresh chats list
      showSuccess(`Chat "${chatToDelete.title}" deleted successfully!`)
    } catch (error: any) {
      console.error('Delete error:', error)
      showError('Delete failed', error.response?.data?.detail || error.message)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setChatToDelete(null)
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.secondary,
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: colors.textPrimary
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 style={{ margin: 0, color: colors.textPrimary }}>Document Chats</h1>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* New Chat Section */}
        <div style={{
          backgroundColor: colors.primary,
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: colors.shadow
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textPrimary }}>
            <Plus size={20} />
            New Chat
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Enter chat title..."
              value={newChatTitle}
              onChange={e => setNewChatTitle(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '8px 12px', 
                border: `1px solid ${colors.border}`, 
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: colors.primary,
                color: colors.textPrimary
              }}
              onKeyPress={e => e.key === 'Enter' && createChat()}
            />
            <button 
              onClick={createChat}
              disabled={loading || !newChatTitle.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: newChatTitle.trim() ? colors.userMessage : colors.textMuted,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: newChatTitle.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </div>

        {/* Chats List */}
        <div style={{
          backgroundColor: colors.primary,
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: colors.shadow
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textPrimary }}>
            <MessageSquare size={20} />
            Chat Sessions
          </h2>
          {chats.length === 0 ? (
            <p style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No chat sessions for this document yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chats.map(chat => (
                <div 
                  key={chat.id}
                  style={{
                    padding: '1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.secondary,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.tertiary
                    e.currentTarget.style.borderColor = colors.userMessage
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.secondary
                    e.currentTarget.style.borderColor = colors.border
                  }}
                >
                  <div 
                    onClick={() => goToChat(chat.id)}
                    style={{
                      cursor: 'pointer',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: colors.textPrimary }}>
                      {chat.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
                      Created {new Date(chat.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(chat.id, chat.title)
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem',
                      backgroundColor: colors.error,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.8,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                    }}
                    title="Delete chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setChatToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Chat"
        message={chatToDelete ? `Are you sure you want to delete "${chatToDelete.title}"? This will delete all messages in this chat and cannot be undone.` : ''}
        confirmText="Delete Chat"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
