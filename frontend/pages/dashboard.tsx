import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { Upload, FileText, LogOut, User, Trash2 } from 'lucide-react'
import ConfirmationModal from '../components/ConfirmationModal'
import { ToastContainer } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../utils/theme'

interface Document {
  id: string
  filename: string
  created_at: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; filename: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Load documents when user is authenticated
  useEffect(() => {
    if (session) {
      loadDocuments()
    }
  }, [session])

  async function loadDocuments() {
    try {
      const response = await axios.get('/api/proxy-backend/documents')
      setDocuments(response.data)
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  async function uploadDocument() {
    if (!uploadFile) return
    
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      // Use the new direct upload API that handles larger files
      await axios.post('/api/direct-upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setUploadFile(null)
      loadDocuments() // Refresh documents list
      showSuccess(`Uploaded ${uploadFile.name} successfully!`)
    } catch (error: any) {
      console.error('Upload error:', error)
      showError('Upload failed', error.response?.data?.detail || error.message)
    } finally {
      setLoading(false)
    }
  }

  function goToDocument(documentId: string) {
    router.push(`/doc/${documentId}`)
  }

  function handleDeleteClick(documentId: string, filename: string) {
    setDocumentToDelete({ id: documentId, filename })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    if (!documentToDelete) return
    
    setIsDeleting(true)
    try {
      await axios.delete(`/api/proxy-backend/documents/${documentToDelete.id}`)
      loadDocuments() // Refresh documents list
      showSuccess(`Document "${documentToDelete.filename}" deleted successfully!`)
    } catch (error: any) {
      console.error('Delete error:', error)
      showError('Delete failed', error.response?.data?.detail || error.message)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setDocumentToDelete(null)
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
        <h1 style={{ margin: 0, color: colors.textPrimary }}>PDF Chat Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {session.user?.image && (
              <img 
                src={session.user.image} 
                alt="Profile" 
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
            )}
            <span style={{ color: colors.textPrimary }}>{session.user?.name}</span>
          </div>
          <ThemeToggle />
          <button 
            onClick={() => signOut()}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.error,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Upload Section */}
        <div style={{
          backgroundColor: colors.primary,
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: colors.shadow
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textPrimary }}>
            <Upload size={20} />
            Upload Document
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              style={{ 
                flex: 1, 
                padding: '8px', 
                border: `1px solid ${colors.border}`, 
                borderRadius: '4px',
                backgroundColor: colors.primary,
                color: colors.textPrimary
              }}
            />
            <button 
              onClick={uploadDocument}
              disabled={loading || !uploadFile}
              style={{
                padding: '8px 16px',
                backgroundColor: uploadFile ? colors.success : colors.textMuted,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploadFile ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div style={{
          backgroundColor: colors.primary,
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: colors.shadow
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textPrimary }}>
            <FileText size={20} />
            My Documents
          </h2>
          {documents.length === 0 ? (
            <p style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No documents uploaded yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  style={{
                    padding: '1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.secondary,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = colors.shadowLg
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.backgroundColor = colors.tertiary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.backgroundColor = colors.secondary
                  }}
                >
                  <div 
                    onClick={() => goToDocument(doc.id)}
                    style={{
                      cursor: 'pointer',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: colors.textPrimary }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(doc.id, doc.filename)
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
                    title="Delete document"
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
          setDocumentToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={documentToDelete ? `Are you sure you want to delete "${documentToDelete.filename}"? This will also delete all associated chat sessions and cannot be undone.` : ''}
        confirmText="Delete Document"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
