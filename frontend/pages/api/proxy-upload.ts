// frontend/pages/api/proxy-upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backend = process.env.BACKEND_URL || 'http://localhost:8000'
  const url = `${backend}/upload`
  const r = await fetch(url, {
    method: 'POST',
    headers: req.headers as any,
    body: req.body
  })
  const text = await r.text()
  res.status(r.status).send(text)
}