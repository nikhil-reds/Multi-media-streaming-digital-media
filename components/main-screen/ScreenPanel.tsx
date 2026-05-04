'use client'

import { useState } from 'react'
import type { Document } from './shared'
import { FileIcon, iconBg } from './shared'

export default function ScreenPanel() {
  const [screens, setScreens] = useState<number[]>([1, 2, 3, 4, 5])
  const [nextId, setNextId] = useState(6)
  const [assignments, setAssignments] = useState<Record<number, Document>>({})
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [focusedScreen, setFocusedScreen] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  function addScreen() {
    setScreens((prev) => [...prev, nextId])
    setNextId((prev) => prev + 1)
  }

  function removeScreen(id: number) {
    setScreens((prev) => prev.filter((s) => s !== id))
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function handleDrop(e: React.DragEvent, id: number) {
    e.preventDefault()
    setDragOver(null)
    try {
      const doc: Document = JSON.parse(e.dataTransfer.getData('application/json'))
      setAssignments((prev) => ({ ...prev, [id]: doc }))
    } catch {}
  }

  function removeAssignment(id: number) {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const screenCard = (id: number, idx: number, compact = false) => {
    const assigned = assignments[id]
    const isOver = dragOver === id

    return (
      <div key={id} className="shrink-0 flex flex-col gap-2 relative group/screen">
        {/* Close button */}
        {!compact && (
          <button
            onClick={() => removeScreen(id)}
            className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover/screen:opacity-100"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Drop zone tile */}
        <div
          className={`${compact ? 'w-36' : 'w-40'} aspect-square rounded-xl border-2 relative overflow-hidden transition-all duration-150
            ${isOver
              ? 'border-blue-400 bg-blue-50 shadow-lg scale-105'
              : assigned
              ? 'border-gray-200 bg-white shadow-sm'
              : 'border-dashed border-gray-200 bg-white'
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(id) }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(e, id)}
        >
          {assigned ? (
            <>
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg(assigned.mimeType)}`}>
                  <FileIcon mimeType={assigned.mimeType} />
                </div>
                <span className="text-xs text-gray-600 text-center leading-snug line-clamp-3 break-all w-full">
                  {assigned.name}
                </span>
              </div>
              {!compact && (
                <button
                  onClick={() => removeAssignment(id)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
              {isOver ? (
                <>
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-blue-500 font-medium">Drop here</span>
                </>
              ) : (
                <>
                  <svg className="w-7 h-7 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                      d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs text-gray-300">Drop doc here</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1">
          <p className="text-xs font-medium text-gray-500">
            Screen {String(idx + 1).padStart(2, '0')}
          </p>
          {!compact && (
            <button
              onClick={() => setFocusedScreen(id)}
              className="text-black hover:text-blue-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  const focusedIdx = focusedScreen !== null ? screens.indexOf(focusedScreen) : -1

  return (
    <>
      <div className="flex-1 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            Screen
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-black px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Show All
            </button>
            <button
              onClick={addScreen}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-black px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Screen
            </button>
          </div>
        </div>

        {/* Screens grid */}
        <div className="flex-1 flex flex-wrap items-start gap-4 px-5 py-5 overflow-y-auto">
          {screens.map((id, idx) => screenCard(id, idx))}
        </div>
      </div>

      {/* Focused screen overlay */}
      {focusedScreen !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setFocusedScreen(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold text-gray-700">
                Screen {String(focusedIdx + 1).padStart(2, '0')}
              </h3>
              <button
                onClick={() => setFocusedScreen(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="w-56 aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
              {assignments[focusedScreen] ? (
                <>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBg(assignments[focusedScreen].mimeType)}`}>
                    <FileIcon mimeType={assignments[focusedScreen].mimeType} />
                  </div>
                  <span className="text-sm text-gray-700 text-center leading-snug break-all">
                    {assignments[focusedScreen].name}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">No document assigned</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show all screens overlay */}
      {showAll && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setShowAll(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-4xl w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-gray-700">
                All Screens <span className="text-gray-400 font-normal ml-1">({screens.length})</span>
              </h3>
              <button
                onClick={() => setShowAll(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-5 p-6 overflow-y-auto">
              {screens.map((id, idx) => screenCard(id, idx, true))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
