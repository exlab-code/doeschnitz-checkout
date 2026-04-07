'use client'

import { useState } from 'react'
import { useEditMode } from './edit-mode-provider'

export function EditToggle() {
  const { isEditing, toggleEditing, showNamePrompt, submitName, cancelNamePrompt } = useEditMode()
  const [nameInput, setNameInput] = useState('')

  if (showNamePrompt) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
        <div className="bg-white border-2 border-black p-4 mx-4 max-w-sm w-full">
          <p className="text-sm font-semibold mb-3">Dein Name</p>
          <p className="text-xs text-gray-500 mb-3">Für das Änderungsprotokoll</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name eingeben"
            autoFocus
            className="w-full border-2 border-black px-3 py-3 text-base font-mono focus:outline-none mb-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nameInput.trim()) submitName(nameInput)
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={cancelNamePrompt}
              className="flex-1 border border-gray-300 px-3 py-2 text-sm text-gray-500 min-h-[44px]"
            >
              Abbrechen
            </button>
            <button
              onClick={() => submitName(nameInput)}
              disabled={!nameInput.trim()}
              className="flex-1 border-2 border-black px-3 py-2 text-sm font-semibold hover:bg-black hover:text-white disabled:opacity-30 min-h-[44px]"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <button
        onClick={toggleEditing}
        className="fixed top-4 right-4 z-[60] px-4 py-2 border-2 border-black bg-black text-white text-sm font-semibold hover:bg-white hover:text-black transition-colors min-h-[44px]"
      >
        Fertig
      </button>
    )
  }

  return (
    <button
      onClick={toggleEditing}
      aria-label="Bearbeiten"
      className="fixed top-4 right-4 w-11 h-11 border-2 z-[60] flex items-center justify-center text-lg transition-colors border-gray-300 bg-white text-gray-400 hover:border-black hover:text-black"
    >
      ✎
    </button>
  )
}
