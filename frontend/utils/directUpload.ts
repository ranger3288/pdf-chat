// frontend/utils/directUpload.ts
import { getSession } from 'next-auth/react'

export async function uploadFileDirectly(file: File): Promise<any> {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('file', file)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  
  const response = await fetch(`${backendUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'X-User-Email': session.user.email,
      'X-User-Name': session.user.name || 'Unknown User',
      'X-Internal-Secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || 'your-internal-secret-change-in-production',
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Upload failed')
  }

  return response.json()
}
