'use client'

import { useEffect, useState } from 'react'
import SessionSidebar from '@/components/main-screen/SessionSidebar'
import FilePanel from '@/components/main-screen/FilePanel'
import ScreenPanel from '@/components/main-screen/ScreenPanel'
import type { Session, SessionDetail } from '@/components/main-screen/shared'

export default function MainScreen() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'playlists'>('sessions')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false))

    fetch('/api/playlists')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPlaylists(Array.isArray(data) ? data : []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoadingPlaylists(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setDetail(null)
    setLoadingDetail(true)

    const url = activeTab === 'sessions'
      ? `/api/sessions/${selectedId}`
      : `/api/playlists/${selectedId}`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (activeTab === 'playlists') {
          setDetail({
            id: data.id,
            status: 'COMPLETED',
            createdAt: data.createdAt,
            documents: data.items.map((item: any) => item.document),
            isPlaylist: true,
            name: data.name
          } as any)
        } else {
          setDetail(data)
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false))
  }, [selectedId, activeTab])

  const handleTabChange = (tab: 'sessions' | 'playlists') => {
    setActiveTab(tab)
    setSelectedId(null)
    setDetail(null)
  }

  return (
    <div
      className="bg-gray-50 flex gap-5 px-6 py-6 overflow-hidden"
      style={{ height: 'calc(100vh - 113px)' }}
    >
      <SessionSidebar
        sessions={sessions}
        loading={activeTab === 'sessions' ? loadingSessions : loadingPlaylists}
        selectedId={selectedId}
        onSelect={setSelectedId}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        playlists={playlists}
      />

      <FilePanel
        selectedId={selectedId}
        detail={detail}
        loading={loadingDetail}
      />

      <ScreenPanel />
    </div>
  )
}

