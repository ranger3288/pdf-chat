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
      
      // Show progress for large files
      const fileSizeMB = uploadFile.size / (1024 * 1024)
      if (fileSizeMB > 5) {
        showSuccess(`Uploading large file (${fileSizeMB.toFixed(1)}MB)... This may take a moment.`)
      }
      
      // Use the original proxy upload with better error handling
      await axios.post('/api/proxy-upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minute timeout for large files
      })
      
      setUploadFile(null)
      loadDocuments() // Refresh documents list
      showSuccess(`Uploaded ${uploadFile.name} successfully!`)
    } catch (error: any) {
      console.error('Upload error:', error)
      if (error.code === 'ECONNABORTED') {
        showError('Upload timeout', 'File is too large or taking too long to process. Try a smaller file.')
      } else {
        showError('Upload failed', error.response?.data?.detail || error.message)
      }
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
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 
            className="gradient-text"
            style={{ 
              margin: 0, 
              fontSize: '1.8rem',
              fontWeight: '700',
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >DocQ&A Dashboard</h1>
        </div>
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1 }}>
        {/* Upload Section */}
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
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Upload size={20} color="white" />
            </div>
            Upload Document
          </h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center',
            position: 'relative'
          }}>
            <div style={{ 
              flex: 1,
              position: 'relative',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: '12px',
              border: `2px dashed ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              padding: '1rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: colors.textSecondary
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{uploadFile ? uploadFile.name : 'Choose a PDF file or drag it here'}</span>
              </div>
            </div>
            
            <button 
              onClick={uploadDocument}
              disabled={loading || !uploadFile}
              style={{
                padding: '12px 24px',
                background: uploadFile 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: uploadFile ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: uploadFile 
                  ? '0 8px 25px rgba(16, 185, 129, 0.3)'
                  : '0 4px 15px rgba(107, 114, 128, 0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (uploadFile) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (uploadFile) {
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
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>

        {/* Documents List */}
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
              <FileText size={20} color="white" />
            </div>
            My Documents
          </h2>
          
          {documents.length === 0 ? (
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
                <FileText size={32} color={colors.textMuted} />
              </div>
              <p style={{ 
                fontSize: '1.1rem',
                fontWeight: '500',
                margin: '0 0 0.5rem 0'
              }}>No documents uploaded yet</p>
              <p style={{ 
                fontSize: '0.9rem',
                margin: 0,
                opacity: 0.7
              }}>Upload your first PDF to get started</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {documents.map(doc => (
                <div 
                  key={doc.id}
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
                  {/* Document icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <FileText size={24} color="white" />
                  </div>
                  
                  <div 
                    onClick={() => goToDocument(doc.id)}
                    style={{
                      cursor: 'pointer',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '0.5rem', 
                      color: colors.textPrimary,
                      fontSize: '1.1rem',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {doc.filename}
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
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
