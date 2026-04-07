'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface EditModeContextValue {
  isEditing: boolean
  authorName: string
  toggleEditing: () => void
}

const EditModeContext = createContext<EditModeContextValue | null>(null)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [authorName, setAuthorName] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('edit-author')
    if (stored) {
      setAuthorName(stored)
    }
  }, [])

  function toggleEditing() {
    if (isEditing) {
      setIsEditing(false)
      return
    }

    let name = localStorage.getItem('edit-author') ?? ''
    if (!name) {
      const prompted = prompt('Dein Name (für das Änderungsprotokoll):')
      if (prompted === null) return
      name = prompted.trim()
      if (!name) return
      localStorage.setItem('edit-author', name)
      setAuthorName(name)
    }

    setIsEditing(true)
  }

  return (
    <EditModeContext.Provider value={{ isEditing, authorName, toggleEditing }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode(): EditModeContextValue {
  const ctx = useContext(EditModeContext)
  if (!ctx) {
    throw new Error('useEditMode must be used within EditModeProvider')
  }
  return ctx
}
