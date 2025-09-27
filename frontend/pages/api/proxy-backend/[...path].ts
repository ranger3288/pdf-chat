// frontend/pages/api/proxy-backend/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, {})
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { path } = req.query
    const pathArray = Array.isArray(path) ? path : [path]
    const backendPath = pathArray.join('/')

    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    const url = `${backend}/api/${backendPath}`
    
    // Forward the request with proper headers
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': session.user.email,
        'X-User-Name': session.user.name || 'Unknown User',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || 'your-internal-secret-change-in-production',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return res.status(response.status).json({ 
        detail: errorText || 'Request failed',
        status: response.status 
      })
    }
    
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
