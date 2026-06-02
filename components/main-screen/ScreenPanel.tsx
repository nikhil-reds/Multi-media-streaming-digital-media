'use client'

import { useEffect, useState } from 'react'
import type { Document } from './shared'
import { FileIcon, iconBg } from './shared'
import { toast } from 'sonner'

type ScreenWithPlaylist = {
  id: string
  name: string
  playlistId: string | null
  playlist?: {
    id: string
    name: string
    items: Array<{
      id: string
      order: number
      document: {
        id: string
        name: string
        mimeType: string
        s3Url: string
      }
    }>
  } | null
}

const renderMediaPreview = (doc: any, sizeClass = "w-12 h-12", iconSizeClass = "w-7 h-7") => {
  const isPlaylist = doc.mimeType === 'application/playlist';
  const previewUrl = doc.s3Url;
  const isImg = (!isPlaylist && doc.mimeType.startsWith('image/')) || (isPlaylist && doc.firstItemMimeType?.startsWith('image/'));
  const isVid = (!isPlaylist && doc.mimeType.startsWith('video/')) || (isPlaylist && doc.firstItemMimeType?.startsWith('video/'));

  return (
    <div className={`${sizeClass} rounded-xl flex items-center justify-center ${iconBg(doc.mimeType)} overflow-hidden shrink-0 shadow-sm border border-gray-150`}>
      {isImg ? (
        <img src={previewUrl} alt={doc.name} className="w-full h-full object-cover" />
      ) : isVid ? (
        <video src={previewUrl} className="w-full h-full object-cover" preload="metadata" muted />
      ) : (
        <FileIcon mimeType={doc.mimeType} className={iconSizeClass} />
      )}
    </div>
  )
}

export default function ScreenPanel() {
  const [screens, setScreens] = useState<ScreenWithPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [focusedScreenId, setFocusedScreenId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Fetch screens on mount
  useEffect(() => {
    fetch('/api/screens')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setScreens(Array.isArray(data) ? data : []))
      .catch((e) => console.error('Error fetching screens:', e))
      .finally(() => setLoading(false))
  }, [])

  async function addScreen() {
    setIsCreating(true)
    try {
      const res = await fetch('/api/screens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const newScreen = await res.json()
        setScreens((prev) => [...prev, newScreen])
        toast.success(`Screen "${newScreen.name}" created successfully`)
      } else {
        toast.error('Failed to create screen')
      }
    } catch (e) {
      console.error('Failed to add screen:', e)
      toast.error('Failed to create screen')
    } finally {
      setIsCreating(false)
    }
  }

  async function removeScreen(id: string) {
    try {
      const res = await fetch(`/api/screens/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setScreens((prev) => prev.filter((s) => s.id !== id))
        if (focusedScreenId === id) setFocusedScreenId(null)
      }
    } catch (e) {
      console.error('Failed to remove screen:', e)
    }
  }

  async function handleDrop(e: React.DragEvent, screenId: string) {
    e.preventDefault()
    setDragOver(null)
    try {
      const playlistStr = e.dataTransfer.getData('application/json-playlist')
      if (playlistStr) {
        const playlistData = JSON.parse(playlistStr)
        
        // Save the screen in the schema
        const res = await fetch(`/api/screens/${screenId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistId: playlistData.id }),
        })

        if (res.ok) {
          const updatedScreen = await res.json()
          setScreens((prev) => prev.map((s) => s.id === screenId ? updatedScreen : s))
          
          // Attach the playlist id in the URL
          const newUrl = `${window.location.pathname}?playlistId=${playlistData.id}`
          window.history.pushState(null, '', newUrl)
        }
      }
    } catch (err) {
      console.error('Error dropping playlist:', err)
    }
  }

  async function removeAssignment(screenId: string) {
    try {
      const res = await fetch(`/api/screens/${screenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: null }),
      })

      if (res.ok) {
        const updatedScreen = await res.json()
        setScreens((prev) => prev.map((s) => s.id === screenId ? updatedScreen : s))
      }
    } catch (err) {
      console.error('Error removing assignment:', err)
    }
  }

  const screenCard = (screen: ScreenWithPlaylist, idx: number, compact = false) => {
    const assignedPlaylist = screen.playlist
    const isOver = dragOver === screen.id

    // Map database playlist to the format expected by renderMediaPreview
    const previewDoc = assignedPlaylist ? {
      name: assignedPlaylist.name,
      mimeType: 'application/playlist',
      isPlaylist: true,
      s3Url: (assignedPlaylist.items && assignedPlaylist.items[0]?.document?.s3Url) || '',
      firstItemMimeType: (assignedPlaylist.items && assignedPlaylist.items[0]?.document?.mimeType) || '',
    } : null

    return (
      <div key={screen.id} className="shrink-0 flex flex-col gap-2 relative group/screen">
        {/* Close button */}
        {!compact && (
          <button
            onClick={() => removeScreen(screen.id)}
            className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover/screen:opacity-100 cursor-pointer"
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
              : assignedPlaylist
              ? 'border-gray-200 bg-white shadow-sm'
              : 'border-dashed border-gray-200 bg-white'
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(screen.id) }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(e, screen.id)}
        >
          {assignedPlaylist ? (
            <>
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                {renderMediaPreview(previewDoc)}
                <span className="text-xs font-semibold text-gray-600 text-center leading-snug line-clamp-3 break-all w-full">
                  {assignedPlaylist.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold uppercase tracking-wider">
                  Playlist
                </span>
              </div>
              {!compact && (
                <button
                  onClick={() => removeAssignment(screen.id)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
                  <span className="text-xs text-gray-300">Drop playlist</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1">
          <p className="text-xs font-medium text-gray-500">
            {screen.name}
          </p>
          {!compact && (
            <button
              onClick={() => {
                if (assignedPlaylist) {
                  const url = `/view/screen/${screen.id}?playlistId=${assignedPlaylist.id}`
                  window.open(url, '_blank')
                } else {
                  setFocusedScreenId(screen.id)
                }
              }}
              className={`transition-colors cursor-pointer ${assignedPlaylist ? 'text-black hover:text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
              title={assignedPlaylist ? `Open ${assignedPlaylist.name} on screen` : 'No playlist assigned'}
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

  const unassignedScreens = screens.filter((s) => s.playlistId === null)
  const focusedScreen = screens.find((s) => s.id === focusedScreenId)

  return (
    <>
      <div className="flex-1 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            Screens
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
          {loading ? (
            <p className="text-sm text-gray-400">Loading screens…</p>
          ) : unassignedScreens.length === 0 && !isCreating ? (
            <p className="text-sm text-gray-450">No unassigned screens found. Click "Add Screen" or manage assignments.</p>
          ) : (
            <>
              {unassignedScreens.map((screen, idx) => screenCard(screen, idx))}
              {isCreating && (
                <div className="shrink-0 flex flex-col gap-2 relative animate-pulse">
                  <div className="w-40 aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/55 flex flex-col items-center justify-center gap-1.5">
                    <svg className="w-7 h-7 text-gray-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                    </svg>
                    <span className="text-xs text-gray-450 font-medium">Creating...</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs font-medium text-gray-400">
                      Screen...
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Focused screen overlay */}
      {focusedScreen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setFocusedScreenId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold text-gray-700">
                {focusedScreen.name}
              </h3>
              <button
                onClick={() => setFocusedScreenId(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="w-56 aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
              {focusedScreen.playlist ? (
                <>
                  {renderMediaPreview({
                    name: focusedScreen.playlist.name,
                    mimeType: 'application/playlist',
                    isPlaylist: true,
                    s3Url: (focusedScreen.playlist.items && focusedScreen.playlist.items[0]?.document?.s3Url) || '',
                    firstItemMimeType: (focusedScreen.playlist.items && focusedScreen.playlist.items[0]?.document?.mimeType) || '',
                  }, "w-20 h-20", "w-10 h-10")}
                  <span className="text-sm text-gray-700 text-center leading-snug break-all font-semibold">
                    {focusedScreen.playlist.name}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">No playlist assigned</span>
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
                Unassigned Screens <span className="text-gray-400 font-normal ml-1">({unassignedScreens.length})</span>
              </h3>
              <button
                onClick={() => setShowAll(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-5 p-6 overflow-y-auto">
              {unassignedScreens.map((screen, idx) => screenCard(screen, idx, true))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
