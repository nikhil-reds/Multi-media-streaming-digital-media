'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileIcon, iconBg, formatBytes } from '@/components/main-screen/shared'
import Toast, { type ToastData } from '@/components/Toast'
import UniversalMediaViewer from '@/components/UniversalMediaViewer'

type Document = {
  id: string
  name: string
  mimeType: string
  s3Url: string
  size: number
}

type Session = {
  id: string
  status: string
  createdAt: string
  documents: Document[]
}

export default function PlaylistBuilder() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistItems, setPlaylistItems] = useState<Document[]>([])
  const [dragOverBuilder, setDragOverBuilder] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Preview Player State
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [rotationInterval, setRotationInterval] = useState(5) // seconds
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch all sessions and documents
  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then(async (data: Session[]) => {
        const detailedSessions = await Promise.all(
          data.map(async (s) => {
            try {
              const res = await fetch(`/api/sessions/${s.id}`)
              return res.json()
            } catch {
              return s
            }
          })
        )
        setSessions(detailedSessions)
      })
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false))
  }, [])

  // Auto-play slideshow effect
  useEffect(() => {
    if (isPlaying && playlistItems.length > 0 && previewIdx !== null) {
      autoplayTimerRef.current = setInterval(() => {
        setPreviewIdx((prev) => {
          if (prev === null) return 0
          return (prev + 1) % playlistItems.length
        })
      }, rotationInterval * 1000)
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [isPlaying, playlistItems.length, previewIdx, rotationInterval])

  const showToast = (message: string, type: ToastData['type']) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }

  // Handle Drag & Drop to Builder
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverBuilder(false)
    try {
      const rawData = e.dataTransfer.getData('application/json')
      if (!rawData) return
      const doc: Document = JSON.parse(rawData)
      if (playlistItems.some((item) => item.id === doc.id)) {
        showToast('Document already in playlist', 'error')
        return
      }
      setPlaylistItems((prev) => [...prev, doc])
      if (previewIdx === null) setPreviewIdx(playlistItems.length)
    } catch (err) {
      console.error(err)
    }
  }

  // Reordering helpers
  const moveItem = (index: number, direction: 'left' | 'right') => {
    const nextIndex = direction === 'left' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= playlistItems.length) return

    const newItems = [...playlistItems]
    const [movedItem] = newItems.splice(index, 1)
    newItems.splice(nextIndex, 0, movedItem)

    setPlaylistItems(newItems)

    if (previewIdx === index) {
      setPreviewIdx(nextIndex)
    } else if (previewIdx === nextIndex) {
      setPreviewIdx(index)
    }
  }

  const removeItem = (index: number) => {
    const newItems = playlistItems.filter((_, idx) => idx !== index)
    setPlaylistItems(newItems)
    if (previewIdx === index) {
      setPreviewIdx(newItems.length > 0 ? 0 : null)
    } else if (previewIdx !== null && previewIdx > index) {
      setPreviewIdx(previewIdx - 1)
    }
  }

  // Save playlist API call
  const handleSave = async () => {
    if (!playlistName.trim()) {
      showToast('Please enter a playlist name', 'error')
      return
    }
    if (playlistItems.length === 0) {
      showToast('Please add at least one document to the playlist', 'error')
      return
    }

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlistName,
          documentIds: playlistItems.map((item) => item.id),
        }),
      })

      if (res.ok) {
        showToast('Playlist saved successfully!', 'success')
        setTimeout(() => router.push('/main-screen'), 1200)
      } else {
        const errorData = await res.json()
        showToast(errorData.error || 'Failed to save playlist', 'error')
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error')
    }
  }

  return (
    <div
      className="bg-gray-50 flex gap-6 px-6 py-6 overflow-hidden"
      style={{ height: 'calc(100vh - 113px)' }}
    >
      <Toast toast={toast} />

      {/* Sidebar: Sessions & Documents */}
      <aside className="w-80 shrink-0 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            Sessions &amp; Files
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingSessions ? (
            <p className="text-sm text-gray-400">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No documents found. Upload files first.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                <div className="px-3.5 py-3 bg-gray-100/50 border-b border-gray-100 flex flex-col">
                  <span className="text-[10px] font-mono text-gray-400 leading-none">
                    SESSION ID: {s.id.slice(0, 12)}…
                  </span>
                  <span className="text-xs font-medium text-gray-600 mt-1">
                    {s.documents?.length || 0} file{s.documents?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="p-2.5 space-y-2">
                  {s.documents && s.documents.length > 0 ? (
                    s.documents.map((doc) => (
                      <div
                        key={doc.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(doc))
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                        className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg(doc.mimeType)} shrink-0`}>
                          <FileIcon mimeType={doc.mimeType} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate group-hover:text-black">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatBytes(doc.size)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 p-2 text-center">No files uploaded.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Workspace (Vertical Layout) */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Top: Playlist Preview Player (Takes most height) */}
        <section className="flex-1 bg-gray-900 rounded-2xl flex flex-col overflow-hidden relative shadow-lg">
          <div className="px-5 py-3 border-b border-gray-800 bg-gray-950 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
              Playlist Review Player
            </h2>
            {previewIdx !== null && playlistItems[previewIdx] && (
              <span className="text-xs font-mono text-gray-400">
                {previewIdx + 1} / {playlistItems.length}
              </span>
            )}
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden p-6">
            {previewIdx !== null && playlistItems[previewIdx] ? (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex-1 relative w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
                  <UniversalMediaViewer doc={playlistItems[previewIdx]} siblingDocs={playlistItems} />
                </div>

                {/* Player Controls */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate max-w-[300px]">
                      {playlistItems[previewIdx].name}
                    </p>
                    <p className="text-[10px] text-gray-500">{playlistItems[previewIdx].mimeType}</p>
                  </div>

                  {/* Autoplay / Speed Controls */}
                  <div className="flex items-center gap-4 bg-gray-850 px-4 py-2 rounded-xl border border-gray-850 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase">
                        Autoplay
                      </label>
                      <input
                        type="checkbox"
                        checked={isPlaying}
                        onChange={(e) => setIsPlaying(e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>
                    {isPlaying && (
                      <select
                        value={rotationInterval}
                        onChange={(e) => setRotationInterval(Number(e.target.value))}
                        className="bg-gray-800 border border-gray-700 text-white text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                      >
                        <option value={3}>3s</option>
                        <option value={5}>5s</option>
                        <option value={10}>10s</option>
                        <option value={15}>15s</option>
                      </select>
                    )}
                  </div>

                  {/* Playback arrows */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : playlistItems.length - 1))}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer"
                      title="Previous"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`p-2.5 rounded-full text-black transition-colors cursor-pointer ${
                        isPlaying ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-white hover:bg-gray-200'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setPreviewIdx((prev) => (prev !== null && prev < playlistItems.length - 1 ? prev + 1 : 0))}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer"
                      title="Next"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-500">
                <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs max-w-[200px] leading-relaxed">
                  Drag files to the builder below and click "Preview" to load the active player.
                </p>
              </div>
            )}
          </div>

          {/* Full-width progress bar at bottom of player */}
          {playlistItems.length > 0 && previewIdx !== null && (
            <div className="w-full h-1 bg-zinc-950 shrink-0">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((previewIdx + 1) / playlistItems.length) * 100}%` }}
              />
            </div>
          )}
        </section>

        {/* Bottom: Drag and Drop builder workspace (Small height) */}
        <section className="h-64 shrink-0 bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0">
            <input
              type="text"
              placeholder="Enter Playlist Name..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-72 text-xs font-semibold text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <button
              onClick={handleSave}
              className="bg-black hover:bg-gray-800 text-white text-[11px] font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Save Playlist
            </button>
          </div>

          {/* Horizontal workspace list */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverBuilder(true)
            }}
            onDragLeave={() => setDragOverBuilder(false)}
            onDrop={handleDrop}
            className={`flex-1 overflow-x-auto p-4 flex gap-4 items-center transition-all ${
              dragOverBuilder ? 'bg-blue-50/40 border-2 border-dashed border-blue-300 m-1 rounded-xl' : ''
            }`}
          >
            {playlistItems.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-center text-gray-400">
                <p className="text-xs font-medium">Drag &amp; Drop Documents Here</p>
                <p className="text-[10px] text-gray-400 mt-1">Files will align horizontally in order</p>
              </div>
            ) : (
              playlistItems.map((item, index) => {
                const isActive = previewIdx === index
                return (
                  <div
                    key={item.id}
                    className={`w-40 h-[105px] shrink-0 rounded-xl border flex flex-col justify-between p-2.5 transition-all relative group ${
                      isActive
                        ? 'border-black bg-black text-white shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Upper content */}
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/10' : iconBg(item.mimeType)}`}>
                        <FileIcon mimeType={item.mimeType} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-semibold truncate leading-tight ${isActive ? 'text-white' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        <p className={`text-[8px] mt-0.5 ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                          {String(index + 1).padStart(2, '0')} • {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>

                    {/* Lower actions bar */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
                      <button
                        onClick={() => setPreviewIdx(index)}
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-white/20 text-white hover:bg-white/35'
                            : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        Preview
                      </button>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveItem(index, 'left')}
                          disabled={index === 0}
                          className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveItem(index, 'right')}
                          disabled={index === playlistItems.length - 1}
                          className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors ml-0.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
