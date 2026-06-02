'use client'

import Link from 'next/link'
import { Session, StatusBadge, formatDate } from './shared'

type Props = {
  sessions: Session[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  activeTab: 'sessions' | 'playlists'
  onTabChange: (tab: 'sessions' | 'playlists') => void
  playlists: any[]
}

export default function SessionSidebar({
  sessions,
  loading,
  selectedId,
  onSelect,
  activeTab,
  onTabChange,
  playlists,
}: Props) {
  const rawItems = activeTab === 'sessions' ? sessions : playlists
  const items = Array.isArray(rawItems) ? rawItems : []

  return (
    <aside className="w-72 shrink-0 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          Playlists
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No {activeTab} found.</p>
            {activeTab === 'playlists' && (
              <Link
                href="/playlist-builder"
                className="inline-block mt-3 text-xs font-semibold text-blue-600 hover:underline"
              >
                Create a Playlist &rarr;
              </Link>
            )}
          </div>
        ) : (
          items.map((s) => {
            const isActive = selectedId === s.id
            const fileCount = activeTab === 'sessions'
              ? s._count?.documents ?? 0
              : s.items?.length ?? 0

            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                draggable={activeTab === 'playlists'}
                onDragStart={(e) => {
                  if (activeTab === 'playlists') {
                    // Store playlist details
                    e.dataTransfer.setData('application/json-playlist', JSON.stringify({
                      id: s.id,
                      name: s.name,
                      itemsCount: fileCount,
                    }))
                    e.dataTransfer.effectAllowed = 'copy'
                  }
                }}
                className={`w-full text-left mx-0 px-5 py-4 transition-all border-b border-gray-50 last:border-b-0 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-50 text-gray-900'
                } ${activeTab === 'playlists' ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                    {activeTab === 'sessions' ? `${s.id.slice(0, 18)}…` : s.name}
                  </span>
                  {activeTab === 'sessions' && !isActive && <StatusBadge status={s.status} />}
                </div>
                <p className={`text-xs ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                  {formatDate(s.createdAt)}
                </p>
                <p className={`text-[11px] mt-1 font-medium ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                  {fileCount} file{fileCount !== 1 ? 's' : ''}
                </p>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

