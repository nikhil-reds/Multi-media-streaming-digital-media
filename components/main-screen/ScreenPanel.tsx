'use client'

import { useState } from 'react'
import type { Document } from './shared'
import { FileIcon, iconBg } from './shared'

export default function ScreenPanel() {
  const [count, setCount] = useState(5)
  const [assignments, setAssignments] = useState<Record<number, Document>>({})
  const [dragOver, setDragOver] = useState<number | null>(null)

  function handleDrop(e: React.DragEvent, screenNum: number) {
    e.preventDefault()
    setDragOver(null)
    try {
      const doc: Document = JSON.parse(e.dataTransfer.getData('application/json'))
      setAssignments((prev) => ({ ...prev, [screenNum]: doc }))
    } catch {}
  }

  function removeAssignment(screenNum: number) {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[screenNum]
      return next
    })
  }

  return (
    <div className="flex-1 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          Screen
        </h2>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-black px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Screen
        </button>
      </div>

      {/* Screens grid */}
      <div className="flex-1 flex flex-wrap items-start gap-4 px-5 py-5 overflow-y-auto">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const assigned = assignments[n]
          const isOver = dragOver === n

          return (
            <div key={n} className="shrink-0 flex flex-col gap-2">
              <div
                className={`w-40 aspect-square rounded-xl border-2 relative overflow-hidden transition-all duration-150
                  ${isOver
                    ? 'border-blue-400 bg-blue-50 shadow-lg scale-105'
                    : assigned
                    ? 'border-gray-200 bg-white shadow-sm'
                    : 'border-dashed border-gray-200 bg-white'
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(n) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, n)}
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
                    <button
                      onClick={() => removeAssignment(n)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
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
              <p className="text-xs font-medium text-gray-500 text-center">
                Screen {String(n).padStart(2, '0')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
