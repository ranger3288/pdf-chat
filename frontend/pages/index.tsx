import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function upload() {
    if (!file) { alert('Choose a PDF'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/proxy-upload', { method: 'POST', body: fd })
      if (!r.ok) throw new Error(await r.text())
      const j = await r.json()
      setDocId(j.document_id)
      setAnswer(null)
      setSources([])
      alert(`Uploaded ${j.filename}. ${j.chunks} chunks indexed.`)
    } catch (e:any) {
      alert(`Upload failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function ask() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const r = await fetch('/api/proxy-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, document_id: docId, top_k: 6 })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.detail || 'Query failed')
      setAnswer(j.answer)
      setSources(j.sources || [])
    } catch (e:any) {
      alert(`Query failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>PDF Chat (local)</h1>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #333', borderRadius: 8 }}>
        <h2>1) Upload a PDF</h2>
        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={upload} disabled={loading || !file} style={{ marginLeft: 12 }}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        {docId && <p style={{ marginTop: 8 }}>Current document id: <code>{docId}</code></p>}
      </section>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #333', borderRadius: 8 }}>
        <h2>2) Ask a question</h2>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask about the PDF..."
          style={{ width: '100%', padding: 8 }}
        />
        <button onClick={ask} disabled={loading || !docId || !query.trim()} style={{ marginTop: 8 }}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>

        {answer && (
          <div style={{ marginTop: 16 }}>
            <h3>Answer</h3>
            <div style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
          </div>
        )}

        {sources.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>Sources</h3>
            {sources.map((s:any, i:number) => (
              <details key={i} style={{ marginBottom: 12 }}>
                <summary>{s.metadata?.source ?? `Source ${i+1}`} (score {s.distance?.toFixed?.(4)})</summary>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{s.chunk_text ?? s.text}</pre>
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
