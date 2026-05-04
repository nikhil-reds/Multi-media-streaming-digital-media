'use client'

import { useState } from 'react'

export default function ScreenPanel() {
  const [count, setCount] = useState(5)

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

      {/* Screens row */}
      <div className="flex-1 flex flex-wrap items-start gap-4 px-5 py-5 overflow-y-auto">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
          <div key={n} className="shrink-0 flex flex-col gap-2">
            <div className="w-40 aspect-square rounded-xl bg-white border border-gray-200 shadow-sm" />
            <p className="text-xs font-medium text-gray-500 text-center">
              Screen {String(n).padStart(2, '0')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
