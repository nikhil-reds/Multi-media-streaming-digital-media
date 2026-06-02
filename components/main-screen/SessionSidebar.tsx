'use client'

import Link from 'next/link'
import { Session, StatusBadge, formatDate, FileIcon, iconBg } from './shared'
import { Skeleton } from '@/components/ui/skeleton'

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
          <div className="px-5 py-2 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex gap-3.5 items-center py-2 border-b border-gray-50/50 last:border-0">
                {activeTab === 'playlists' && (
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <Skeleton className="h-3 w-2/3 rounded-md" />
                    {activeTab === 'sessions' && <Skeleton className="h-4 w-12 rounded-full" />}
                  </div>
                  <Skeleton className="h-2 w-1/3 rounded-md" />
                  <Skeleton className="h-2 w-1/4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
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

            const firstDoc = activeTab === 'playlists' ? s.items?.[0]?.document : null

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
                      firstItemThumbnail: firstDoc?.s3Url || '',
                      firstItemMimeType: firstDoc?.mimeType || '',
                    }))
                    e.dataTransfer.effectAllowed = 'copy'
                  }
                }}
                className={`w-full text-left mx-0 px-5 py-4 transition-all border-b border-gray-50 last:border-b-0 cursor-pointer flex gap-3.5 items-center ${
                  isActive
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-50 text-gray-950'
                } ${activeTab === 'playlists' ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {activeTab === 'playlists' && (
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${iconBg(firstDoc?.mimeType || 'application/playlist')} overflow-hidden border border-gray-150 shadow-sm`}>
                    {firstDoc?.mimeType.startsWith('image/') ? (
                      <img src={firstDoc.s3Url} alt={s.name} className="w-full h-full object-cover" />
                    ) : firstDoc?.mimeType.startsWith('video/') ? (
                      <video src={firstDoc.s3Url} className="w-full h-full object-cover" preload="metadata" muted />
                    ) : (
                      <FileIcon mimeType={firstDoc?.mimeType || 'application/playlist'} className="w-5 h-5" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {activeTab === 'sessions' ? `${s.id.slice(0, 18)}…` : s.name}
                    </span>
                    {activeTab === 'sessions' && !isActive && <StatusBadge status={s.status} />}
                  </div>
                  <p className={`text-[10px] ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                    {formatDate(s.createdAt)}
                  </p>
                  <p className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                    {fileCount} file{fileCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

