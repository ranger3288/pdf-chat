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
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
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
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '0',
        right: '0',
        width: '600px',
        height: '600px',
        background: theme === 'dark' 
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 15s ease-in-out infinite',
        zIndex: 0,
        transform: 'translate(30%, -30%)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '400px',
        height: '400px',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 8s ease-in-out infinite',
        zIndex: 0,
        transform: 'translate(-20%, 20%)'
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
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
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
              padding: '12px 16px',
              background: documentId 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: documentId ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              opacity: documentId ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (documentId) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (documentId) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            <ArrowLeft size={16} />
            {documentId ? 'Back to Document Chats' : 'Loading...'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              animation: 'bounce 3s ease-in-out infinite'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.8rem',
              fontWeight: '700',
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              // Fallback for browsers that don't support background-clip: text
              color: theme === 'dark' ? '#4facfe' : '#2d3748'
            }}>Chat</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {sources.length > 0 && (
        <button
              onClick={() => setShowSources(!showSources)}
          style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
                borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
                gap: '0.5rem',
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
              Sources ({sources.length})
              {showSources ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
          )}
        
          <button
            onClick={handleDeleteClick}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            title="Delete this chat"
          >
            <Trash2 size={16} />
            Delete Chat
          </button>
        </div>
      </header>

      {/* Sources Panel */}
      {showSources && sources.length > 0 && (
        <div style={{
          background: theme === 'dark'
            ? 'rgba(30, 30, 50, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '1.5rem 2rem',
          borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          maxHeight: '200px',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '16px', 
            color: colors.textPrimary,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sources.map((source, index) => (
              <div key={index} style={{
                padding: '1rem',
                background: theme === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: colors.textSecondary, 
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Source {index + 1} (Score: {source.score.toFixed(3)})
                </div>
                <div style={{ 
                  fontSize: '14px',
                  color: colors.textPrimary,
                  lineHeight: '1.5'
                }}>
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
        padding: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            color: colors.textSecondary,
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              border: `2px dashed ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0',
              color: colors.textPrimary
            }}>Start a conversation</h3>
            <p style={{ 
              fontSize: '1rem',
              margin: 0,
              opacity: 0.7
            }}>Ask a question about the document to begin chatting</p>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '1rem 1.5rem',
                    borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: message.role === 'user' 
                      ? '#4285f4'
                      : theme === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(255,255,255,0.8)',
                    backdropFilter: message.role === 'assistant' ? 'blur(10px)' : 'none',
                    color: message.role === 'user' ? 'white' : colors.textPrimary,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word',
                    border: message.role === 'assistant' 
                      ? `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '15px'
                  }}>{message.content}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    opacity: 0.7, 
                    marginTop: '0.75rem',
                    textAlign: 'right',
                    fontWeight: '500'
                  }}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '20px 20px 20px 4px',
                  background: theme === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  color: colors.textSecondary,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
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
        padding: '2rem',
        background: theme === 'dark'
          ? 'rgba(30, 30, 50, 0.8)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        flexShrink: 0,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
          <div style={{ 
            flex: 1,
            position: 'relative',
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: '16px',
            border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            padding: '1rem',
            transition: 'all 0.3s ease'
          }}>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the document..."
              disabled={loading}
              style={{
                width: '100%',
                padding: '0',
                border: 'none',
                background: 'transparent',
                resize: 'none',
                minHeight: '24px',
                maxHeight: '120px',
                fontFamily: 'inherit',
                fontSize: '16px',
                color: colors.textPrimary,
                outline: 'none',
                lineHeight: '1.5'
              }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim()}
            style={{
              padding: '12px 24px',
              background: inputValue.trim() && !loading 
                ? 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !loading) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !loading) {
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
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send
              </>
            )}
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
