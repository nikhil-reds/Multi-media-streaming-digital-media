'use client'

import { Session, StatusBadge, formatDate } from './shared'

type Props = {
  sessions: Session[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function SessionSidebar({ sessions, loading, selectedId, onSelect }: Props) {
  return (
    <aside className="w-72 shrink-0 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          Sessions
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No sessions found.</p>
        ) : (
          sessions.map((s) => {
            const isActive = selectedId === s.id
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`w-full text-left mx-0 px-5 py-4 transition-all ${
                  isActive
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-50 text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-xs font-mono truncate ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                    {s.id.slice(0, 18)}…
                  </span>
                  {!isActive && <StatusBadge status={s.status} />}
                </div>
                <p className={`text-xs ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                  {formatDate(s.createdAt)}
                </p>
                <p className={`text-xs mt-1 font-medium ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                  {s._count.documents} file{s._count.documents !== 1 ? 's' : ''}
                </p>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
