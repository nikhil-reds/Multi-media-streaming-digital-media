'use client'

import { useState, useEffect, useRef } from 'react'
import CloseButton from '../../[docId]/CloseButton'
import UniversalMediaViewer from '@/components/UniversalMediaViewer'

type PlaylistItem = {
  id: string
  name: string
  mimeType: string
  s3Url: string
  order: number
}

type Playlist = {
  id: string
  name: string
  loopCount: number
  loopUnlimited: boolean
  items: PlaylistItem[]
}

type ScreenPlayerProps = {
  screenName: string
  playlist: Playlist | null
}

export default function ScreenPlayer({ screenName, playlist }: ScreenPlayerProps) {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentLoopCount, setCurrentLoopCount] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [rotationInterval, setRotationInterval] = useState(5) // default 5 seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeItem = playlist?.items[index]

  const handleNext = () => {
    if (!playlist || playlist.items.length === 0) return
    setIndex((prev) => {
      const nextIdx = prev + 1
      if (nextIdx >= playlist.items.length) {
        if (!playlist.loopUnlimited && currentLoopCount + 1 >= playlist.loopCount) {
          setIsPlaying(false)
          setIsFinished(true)
          return prev // stay on last item
        }
        setCurrentLoopCount((c) => c + 1)
        return 0
      }
      return nextIdx
    })
  }

  const handlePrev = () => {
    if (!playlist || playlist.items.length === 0) return
    setIsFinished(false)
    setIndex((prev) => {
      const prevIdx = prev - 1
      if (prevIdx < 0) {
        // Going backwards wraps around
        return playlist.items.length - 1
      }
      return prevIdx
    })
  }

  // Ref-based callback wrapper to keep timer stable
  const handleNextRef = useRef(handleNext)
  useEffect(() => {
    handleNextRef.current = handleNext
  })

  // Auto-play slideshow effect
  useEffect(() => {
    if (isPlaying && playlist && playlist.items.length > 1 && !isFinished) {
      timerRef.current = setInterval(() => {
        handleNextRef.current()
      }, rotationInterval * 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, rotationInterval, playlist, isFinished])

  // Reset play states if playlist restarts
  const restartPlaylist = () => {
    setIndex(0)
    setCurrentLoopCount(0)
    setIsFinished(false)
    setIsPlaying(true)
  }

  if (!playlist || playlist.items.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white select-none">
        <div className="max-w-md text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <svg className="w-8 h-8 text-zinc-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white/90">{screenName}</h2>
          <p className="text-sm text-zinc-500">
            No playlist is assigned to this screen. Please assign a playlist in the dashboard.
          </p>
          <CloseButton />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white select-none relative">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-zinc-950/95 border-b border-zinc-900 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white font-bold uppercase tracking-wider">
            {screenName}
          </span>
          <span className="text-sm font-semibold truncate text-white/90">
            {playlist.name}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/60 truncate max-w-[250px]">
            {activeItem?.name}
          </span>
          <span className="text-xs text-white/30 font-mono">({activeItem?.mimeType})</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Looping Status Badge */}
          <div className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {playlist.loopUnlimited ? (
              <span>Loop: Unlimited (Pass {currentLoopCount + 1})</span>
            ) : (
              <span>
                Loop: {currentLoopCount + 1} / {playlist.loopCount}
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-white/60">
            {index + 1} / {playlist.items.length}
          </span>
          <CloseButton />
        </div>
      </div>

      {/* Main Content Viewer Area */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* Playback Finished State Overlay */}
        {isFinished && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">Playlist Completed</h3>
            <p className="text-sm text-zinc-400 text-center max-w-xs">
              This screen has finished playing the playlist {playlist.loopCount} times as configured.
            </p>
            <button
              onClick={restartPlaylist}
              className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Replay Playlist
            </button>
          </div>
        )}

        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-4 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/75 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          style={{ opacity: 0.8 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Media Frame */}
        {activeItem && (
          <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
            <UniversalMediaViewer doc={activeItem} siblingDocs={playlist.items} />
          </div>
        )}

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/75 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          style={{ opacity: 0.8 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-950/80 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-zinc-900 flex items-center gap-6 shadow-2xl">
        {/* Play/Pause Button */}
        <button
          onClick={() => {
            if (isFinished) {
              restartPlaylist()
            } else {
              setIsPlaying(!isPlaying)
            }
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isPlaying && !isFinished ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white text-black hover:bg-gray-200'
          }`}
          title={isFinished ? 'Replay' : isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
        >
          {isFinished ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Navigation Info */}
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider leading-none">
            Screen Autoplay
          </span>
          <span className="text-xs font-semibold mt-1">
            {isFinished ? 'Finished' : isPlaying ? 'Playing' : 'Paused'}
          </span>
        </div>

        {/* Speed Selector */}
        {isPlaying && !isFinished && (
          <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
            <span className="text-[10px] font-semibold text-white/40 uppercase">
              Interval:
            </span>
            <select
              value={rotationInterval}
              onChange={(e) => setRotationInterval(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={3}>3 Seconds</option>
              <option value={5}>5 Seconds</option>
              <option value={10}>10 Seconds</option>
              <option value={15}>15 Seconds</option>
            </select>
          </div>
        )}
      </div>

      {/* Full-width Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-950 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
          style={{ width: `${((index + 1) / playlist.items.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
