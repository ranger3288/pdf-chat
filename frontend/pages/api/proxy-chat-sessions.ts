// frontend/pages/api/proxy-chat-sessions.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backend = process.env.BACKEND_URL || 'http://localhost:8000'
  const url = `${backend}/chat-sessions`
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'authorization': req.headers.authorization || '',
        'content-type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })
    
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Chat sessions proxy error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
