'use client'

import { useEditMode } from './edit-mode-provider'

export function EditToggle() {
  const { isEditing, toggleEditing } = useEditMode()

  if (isEditing) {
    return (
      <button
        onClick={toggleEditing}
        className="fixed top-4 right-4 z-50 px-4 py-2 border-2 border-black bg-black text-white text-sm font-semibold hover:bg-white hover:text-black transition-colors"
      >
        Fertig
      </button>
    )
  }

  return (
    <button
      onClick={toggleEditing}
      aria-label="Bearbeiten"
      className="fixed top-4 right-4 w-10 h-10 border-2 z-50 flex items-center justify-center text-lg transition-colors border-gray-300 bg-white text-gray-400 hover:border-black hover:text-black"
    >
      ✎
    </button>
  )
}
