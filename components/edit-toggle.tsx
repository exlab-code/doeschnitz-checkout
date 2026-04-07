'use client'

import { useEditMode } from './edit-mode-provider'

export function EditToggle() {
  const { isEditing, toggleEditing } = useEditMode()

  return (
    <button
      onClick={toggleEditing}
      aria-label={isEditing ? 'Bearbeitung beenden' : 'Bearbeitung starten'}
      className={`fixed bottom-4 right-4 w-10 h-10 border-2 z-50 flex items-center justify-center text-lg transition-colors ${
        isEditing
          ? 'border-black bg-black text-white'
          : 'border-gray-300 bg-white text-gray-400'
      }`}
    >
      {isEditing ? '✕' : '✎'}
    </button>
  )
}
