import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backend}/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'authorization': req.headers.authorization || '',
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Query proxy error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}