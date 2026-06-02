'use client'

import { useState, useEffect, useRef } from 'react'
import CloseButton from '../../[docId]/CloseButton'

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
  items: PlaylistItem[]
}

export default function PlaylistPlayer({ playlist }: { playlist: Playlist }) {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [rotationInterval, setRotationInterval] = useState(5) // default 5 seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeItem = playlist.items[index]

  // Auto-play slideshow effect
  useEffect(() => {
    if (isPlaying && playlist.items.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % playlist.items.length)
      }, rotationInterval * 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, rotationInterval, playlist.items.length])

  if (playlist.items.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white/50">
        <p>No items in this playlist.</p>
        <CloseButton />
      </div>
    )
  }

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % playlist.items.length)
  }

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + playlist.items.length) % playlist.items.length)
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white select-none relative">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-black/95 border-b border-white/10 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs px-2 py-0.5 rounded bg-orange-500 text-black font-bold uppercase tracking-wider">
            Playlist
          </span>
          <span className="text-sm font-semibold truncate text-white/90">
            {playlist.name}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/60 truncate max-w-[250px]">
            {activeItem.name}
          </span>
          <span className="text-xs text-white/30 font-mono">({activeItem.mimeType})</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-white/60">
            {index + 1} / {playlist.items.length}
          </span>
          <CloseButton />
        </div>
      </div>

      {/* Main Content Viewer Area */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-4 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/75 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          style={{ opacity: 0.8 }} // always visible at low opacity
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Media Frame */}
        <div className="w-full h-full flex items-center justify-center p-6">
          {activeItem.mimeType.startsWith('video/') ? (
            <video
              key={activeItem.id}
              src={activeItem.s3Url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
          ) : activeItem.mimeType.startsWith('image/') ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={activeItem.s3Url}
              alt={activeItem.name}
              className="max-w-full max-h-full object-contain select-none"
            />
          ) : activeItem.mimeType === 'application/pdf' ? (
            <iframe
              src={activeItem.s3Url}
              title={activeItem.name}
              className="w-full h-full border-0 rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <svg className="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">{activeItem.name}</p>
              <span className="text-xs text-gray-500">Preview not supported for this file type.</span>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/75 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          style={{ opacity: 0.8 }} // always visible at low opacity
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isPlaying ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-white text-black hover:bg-gray-200'
          }`}
          title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
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

        {/* Navigation Info */}
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider leading-none">
            Autoplay Status
          </span>
          <span className="text-xs font-semibold mt-1">
            {isPlaying ? 'Playing Slideshow' : 'Paused'}
          </span>
        </div>

        {/* Speed Selector */}
        {isPlaying && (
          <div className="flex items-center gap-2 border-l border-white/10 pl-6">
            <span className="text-[10px] font-semibold text-white/40 uppercase">
              Interval:
            </span>
            <select
              value={rotationInterval}
              onChange={(e) => setRotationInterval(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-400"
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
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
          style={{ width: `${((index + 1) / playlist.items.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
