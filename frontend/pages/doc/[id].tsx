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
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '600px',
        height: '600px',
        background: theme === 'dark' 
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 15s ease-in-out infinite',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 8s ease-in-out infinite',
        zIndex: 0
      }} />
      
      {/* Header */}
      <header style={{
        background: theme === 'dark'
          ? 'rgba(30, 30, 50, 0.8)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        padding: '1.5rem 2rem',
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              animation: 'bounce 3s ease-in-out infinite'
            }}>
              <MessageSquare size={24} color="white" />
            </div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.8rem',
              fontWeight: '700',
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              // Fallback for browsers that don't support background-clip: text
              color: theme === 'dark' ? '#f093fb' : '#2d3748'
            }}>Document Chats</h1>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1 }}>
        {/* New Chat Section */}
        <div style={{
          background: theme === 'dark'
            ? 'rgba(30, 30, 50, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '2rem',
          borderRadius: '20px',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 50%, #667eea 100%)',
            borderRadius: '20px 20px 0 0'
          }} />
          
          <h2 style={{ 
            margin: '0 0 1.5rem 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            color: colors.textPrimary,
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Plus size={20} color="white" />
            </div>
            New Chat
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              flex: 1,
              position: 'relative',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: '12px',
              border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              padding: '1rem',
              transition: 'all 0.3s ease'
            }}>
              <input 
                type="text" 
                placeholder="Enter chat title..."
                value={newChatTitle}
                onChange={e => setNewChatTitle(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '0',
                  border: 'none',
                  background: 'transparent',
                  color: colors.textPrimary,
                  fontSize: '16px',
                  outline: 'none'
                }}
                onKeyPress={e => e.key === 'Enter' && createChat()}
              />
            </div>
            
            <button 
              onClick={createChat}
              disabled={loading || !newChatTitle.trim()}
              style={{
                padding: '12px 24px',
                background: newChatTitle.trim() 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: newChatTitle.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: newChatTitle.trim() 
                  ? '0 8px 25px rgba(16, 185, 129, 0.3)'
                  : '0 4px 15px rgba(107, 114, 128, 0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (newChatTitle.trim()) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (newChatTitle.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Chat
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chats List */}
        <div style={{
          background: theme === 'dark'
            ? 'rgba(30, 30, 50, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '2rem',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
            borderRadius: '20px 20px 0 0'
          }} />
          
          <h2 style={{ 
            margin: '0 0 1.5rem 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            color: colors.textPrimary,
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <MessageSquare size={20} color="white" />
            </div>
            Chat Sessions
          </h2>
          
          {chats.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: colors.textSecondary
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: `2px dashed ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <MessageSquare size={32} color={colors.textMuted} />
              </div>
              <p style={{ 
                fontSize: '1.1rem',
                fontWeight: '500',
                margin: '0 0 0.5rem 0'
              }}>No chat sessions for this document yet</p>
              <p style={{ 
                fontSize: '0.9rem',
                margin: 0,
                opacity: 0.7
              }}>Create your first chat to start asking questions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chats.map(chat => (
                <div 
                  key={chat.id}
                  style={{
                    background: theme === 'dark' 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)'
                    e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                  }}
                >
                  <div 
                    onClick={() => goToChat(chat.id)}
                    style={{
                      cursor: 'pointer',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '0.5rem', 
                      color: colors.textPrimary,
                      fontSize: '1.1rem',
                      lineHeight: '1.4'
                    }}>
                      {chat.title}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 7V3C8 2.4 8.4 2 9 2H15C15.6 2 16 2.4 16 3V7H19C19.6 7 20 7.4 20 8V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V8C4 7.4 4.4 7 5 7H8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 7H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
                      top: '1rem',
                      right: '1rem',
                      padding: '0.5rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.8,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
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
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
