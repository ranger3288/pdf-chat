import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function upload() {
    if (!file) return alert('choose a pdf file')
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/proxy-upload', { method: 'POST', body: fd })
    const j = await r.json()
    setLoading(false)
    if (r.ok) alert('uploaded: ' + j.document_id)
    else alert('upload failed: ' + j.detail || JSON.stringify(j))
  }

  async function ask() {
    if (!query) return
    setLoading(true)
    const r = await fetch('/api/proxy-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k: 4 })
    })
    const j = await r.json()
    setLoading(false)
    setAnswer(j.answer)
    setSources(j.sources || [])
  }

  return (
    <main style={{ padding: 32, fontFamily: 'Arial' }}>
      <h1>Document Q&A — MVP</h1>
      <section style={{ marginTop: 24 }}>
        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={upload} style={{ marginLeft: 12 }}>Upload PDF</button>
      </section>

      <section style={{ marginTop: 24 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask a question..." style={{ width: '60%' }} />
        <button onClick={ask} style={{ marginLeft: 12 }}>Ask</button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Answer</h2>
        {loading ? <div>Loading...</div> : <pre>{answer ?? 'No answer yet'}</pre>}
        {sources.length > 0 && (
          <div>
            <h3>Sources</h3>
            {sources.map((s, i) => (
              <details key={i} style={{ marginBottom: 12 }}>
                <summary>{s.metadata?.source ?? `Source ${i+1}`}</summary>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{s.chunk_text ?? s.text}</pre>
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}