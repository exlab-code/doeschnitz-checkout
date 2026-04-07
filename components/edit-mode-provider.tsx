'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface EditModeContextValue {
  isEditing: boolean
  authorName: string
  toggleEditing: () => void
  showNamePrompt: boolean
  submitName: (name: string) => void
  cancelNamePrompt: () => void
}

const EditModeContext = createContext<EditModeContextValue | null>(null)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)

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

    const name = localStorage.getItem('edit-author') ?? ''
    if (!name) {
      setShowNamePrompt(true)
      return
    }

    setIsEditing(true)
  }

  function submitName(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem('edit-author', trimmed)
    setAuthorName(trimmed)
    setShowNamePrompt(false)
    setIsEditing(true)
  }

  function cancelNamePrompt() {
    setShowNamePrompt(false)
  }

  return (
    <EditModeContext.Provider
      value={{
        isEditing,
        authorName,
        toggleEditing,
        showNamePrompt,
        submitName,
        cancelNamePrompt,
      }}
    >
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
