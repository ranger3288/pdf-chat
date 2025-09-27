import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { Upload, FileText, LogOut, User } from 'lucide-react'

interface Document {
  id: string
  filename: string
  created_at: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

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
      
      await axios.post('/api/proxy-upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setUploadFile(null)
      loadDocuments() // Refresh documents list
      alert(`Uploaded ${uploadFile.name} successfully!`)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function goToDocument(documentId: string) {
    router.push(`/doc/${documentId}`)
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
        <h1 style={{ margin: 0, color: '#333' }}>PDF Chat Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {session.user?.image && (
              <img 
                src={session.user.image} 
                alt="Profile" 
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
            )}
            <span>{session.user?.name}</span>
          </div>
          <button 
            onClick={() => signOut()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
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
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} />
            Upload Document
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button 
              onClick={uploadDocument}
              disabled={loading || !uploadFile}
              style={{
                padding: '8px 16px',
                backgroundColor: uploadFile ? '#4caf50' : '#ccc',
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
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} />
            My Documents
          </h2>
          {documents.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No documents uploaded yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => goToDocument(doc.id)}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'all 0.2s',
                    ':hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                    {doc.filename}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
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
