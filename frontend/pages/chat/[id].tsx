import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { ArrowLeft, Send, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import ConfirmationModal from '../../components/ConfirmationModal'
import { ToastContainer } from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { useTheme } from '../../contexts/ThemeContext'
import { getThemeColors } from '../../utils/theme'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Source {
  text: string
  score: number
  metadata: any
}

interface ChatResponse {
  answer: string
  sources: Source[]
}

interface ChatDetails {
  id: string
  title: string
  document_id: string
  created_at: string
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  const { id: chatId } = router.query
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  const [showSources, setShowSources] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Load chat details and messages when chat ID is available
  useEffect(() => {
    if (chatId && session) {
      loadChatDetails()
      loadMessages()
    }
  }, [chatId, session])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChatDetails() {
    try {
      const response = await axios.get(`/api/proxy-backend/chat-details/${chatId}`)
      const chatDetails: ChatDetails = response.data
      console.log('Loaded chat details:', chatDetails)
      setDocumentId(chatDetails.document_id)
    } catch (error) {
      console.error('Failed to load chat details:', error)
    }
  }

  async function loadMessages() {
    try {
      const response = await axios.get(`/api/proxy-backend/chats/${chatId}/messages`)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  async function sendMessage() {
    if (!inputValue.trim() || loading) return
    
    const userMessage = inputValue.trim()
    setInputValue('')
    setLoading(true)
    
    try {
      const response = await axios.post(`/api/proxy-backend/chats/${chatId}/ask`, {
        query: userMessage
      })
      
      const chatResponse: ChatResponse = response.data
      
      // Add user message
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      }
      
      // Add assistant message
      const newAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: chatResponse.answer,
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, newUserMessage, newAssistantMessage])
      setSources(chatResponse.sources)
    } catch (error: any) {
      console.error('Failed to send message:', error)
      showError('Failed to send message', error.response?.data?.detail || error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleDeleteClick() {
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    setIsDeleting(true)
    try {
      console.log('Deleting chat:', chatId)
      await axios.delete(`/api/proxy-backend/chats/${chatId}`)
      showSuccess('Chat deleted successfully!')
      console.log('Delete successful, documentId:', documentId)
      if (documentId) {
        router.push(`/doc/${documentId}`)
      } else {
        console.log('Document ID not available, going to dashboard')
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      showError('Delete failed', error.response?.data?.detail || error.message)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
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
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: colors.secondary
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => {
              console.log('Back button clicked, documentId:', documentId)
              if (documentId) {
                router.push(`/doc/${documentId}`)
              } else {
                console.log('Document ID not available, going to dashboard')
                router.push('/dashboard')
              }
            }}
            disabled={!documentId}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: documentId ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: documentId ? 1 : 0.6,
              color: colors.textPrimary
            }}
          >
            <ArrowLeft size={16} />
            {documentId ? 'Back to Document Chats' : 'Loading...'}
          </button>
          <h1 style={{ margin: 0, color: colors.textPrimary }}>Chat</h1>
        </div>
        
        <button
          onClick={handleDeleteClick}
          style={{
            padding: '8px 12px',
            backgroundColor: colors.error,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          title="Delete this chat"
        >
          <Trash2 size={16} />
          Delete Chat
        </button>
        
        {sources.length > 0 && (
          <button
            onClick={() => setShowSources(!showSources)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Sources ({sources.length})
            {showSources ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </header>

      {/* Sources Panel */}
      {showSources && sources.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem 2rem',
          borderBottom: '1px solid #e0e0e0',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', color: '#666' }}>Sources</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sources.map((source, index) => (
              <div key={index} style={{
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem' }}>
                  Source {index + 1} (Score: {source.score.toFixed(3)})
                </div>
                <div style={{ fontSize: '14px' }}>
                  {source.text.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 2rem',
        backgroundColor: colors.secondary
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: colors.textSecondary
          }}>
            Start a conversation by asking a question about the document
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: message.role === 'user' ? colors.userMessage : colors.assistantMessage,
                    color: message.role === 'user' ? colors.messageTextUser : colors.messageText,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    opacity: 0.7, 
                    marginTop: '0.5rem',
                    textAlign: 'right'
                  }}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: colors.assistantMessage,
                  color: colors.textSecondary,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: colors.primary,
        borderTop: `1px solid ${colors.border}`,
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the document..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              fontSize: '16px',
              backgroundColor: colors.primary,
              color: colors.textPrimary
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim()}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: inputValue.trim() && !loading ? colors.userMessage : colors.textMuted,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This will delete all messages in this chat and cannot be undone."
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
