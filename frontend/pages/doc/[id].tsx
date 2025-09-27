import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { MessageSquare, Plus, ArrowLeft } from 'lucide-react'

interface Chat {
  id: string
  title: string
  created_at: string
}

export default function DocumentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: documentId } = router.query
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')

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
      alert(`Failed to create chat: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function goToChat(chatId: string) {
    router.push(`/chat/${chatId}`)
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
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e0e0e0',
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
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 style={{ margin: 0, color: '#333' }}>Document Chats</h1>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* New Chat Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
              onKeyPress={e => e.key === 'Enter' && createChat()}
            />
            <button 
              onClick={createChat}
              disabled={loading || !newChatTitle.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: newChatTitle.trim() ? '#4285f4' : '#ccc',
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
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} />
            Chat Sessions
          </h2>
          {chats.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No chat sessions for this document yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => goToChat(chat.id)}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.borderColor = '#4285f4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#e0e0e0'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#333' }}>
                    {chat.title}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Created {new Date(chat.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
