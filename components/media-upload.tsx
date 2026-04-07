'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { useEditMode } from './edit-mode-provider'

interface MediaUploadProps {
  onUploaded: (url: string, type: 'image' | 'video', filename: string) => void
}

export function MediaUpload({ onUploaded }: MediaUploadProps) {
  const { isEditing } = useEditMode()
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isEditing) return null

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setStatus(null)

    try {
      const isVideo = file.type.startsWith('video/')

      if (isVideo) {
        // Video → upload to Cloudinary
        setStatus('Video wird hochgeladen...')
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        if (!cloudName) {
          throw new Error('Cloudinary nicht konfiguriert')
        }

        const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'doeschnitz'
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', preset)
        formData.append('resource_type', 'video')

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
          { method: 'POST', body: formData }
        )
        if (!res.ok) throw new Error('Video-Upload fehlgeschlagen')

        const data = await res.json()
        // Add auto format/quality transformation for optimal delivery
        const url = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
        onUploaded(url, 'video', file.name)
      } else {
        // Image → compress client-side, then upload to our server
        setStatus('Bild wird komprimiert...')
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        })

        setStatus('Bild wird hochgeladen...')
        const formData = new FormData()
        formData.append('file', compressed, file.name)

        const res = await fetch('/api/media', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Upload fehlgeschlagen (${res.status})`)
        }
        const data = await res.json() as { url: string; filename: string }
        onUploaded(data.url, 'image', data.filename)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      setStatus(null)
      e.target.value = ''
    }
  }

  return (
    <div>
      <label className={`flex items-center justify-center border border-dashed border-gray-400 px-3 py-3 text-sm cursor-pointer transition-colors min-h-[44px] ${
        uploading ? 'text-gray-400 cursor-wait' : 'text-gray-500 hover:border-black hover:text-black'
      }`}>
        {status || '+ Foto / Video hinzufügen'}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
