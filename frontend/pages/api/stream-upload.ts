// frontend/pages/api/stream-upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { Readable } from 'stream'

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle large files
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, {})
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    const url = `${backend}/api/upload`
    
    // Collect the request body chunks
    const chunks: Buffer[] = []
    const readable = new Readable({
      read() {}
    })
    
    req.on('data', (chunk) => {
      chunks.push(chunk)
      readable.push(chunk)
    })
    
    req.on('end', async () => {
      readable.push(null)
      
      try {
        // Forward the request with proper headers
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-User-Email': session.user.email,
            'X-User-Name': session.user.name || 'Unknown User',
            'X-Internal-Secret': process.env.INTERNAL_API_SECRET || 'your-internal-secret-change-in-production',
            'Content-Type': req.headers['content-type'] || 'multipart/form-data',
            'Content-Length': req.headers['content-length'] || Buffer.concat(chunks).length.toString(),
          },
          body: Buffer.concat(chunks)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Backend upload error:', response.status, errorText)
          return res.status(response.status).json({ 
            detail: errorText || 'Upload failed',
            status: response.status 
          })
        }
        
        const data = await response.json()
        res.status(response.status).json(data)
      } catch (error) {
        console.error('Upload proxy error:', error)
        res.status(500).json({ message: 'Internal server error' })
      }
    })
    
    req.on('error', (error) => {
      console.error('Request error:', error)
      res.status(500).json({ message: 'Internal server error' })
    })
    
  } catch (error) {
    console.error('Stream upload error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
