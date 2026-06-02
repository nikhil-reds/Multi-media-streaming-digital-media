'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search,
  Trash2,
  Eye,
  Info,
  Clock,
  Monitor,
  ExternalLink,
  PlusCircle,
  PlaySquare,
  Play,
  ArrowUpRight
} from 'lucide-react'
import { iconBg, formatDate } from '@/components/main-screen/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import Link from 'next/link'

type PlaylistItem = {
  id: string
  order: number
  document: {
    id: string
    name: string
    mimeType: string
    s3Url: string
  }
}

type Playlist = {
  id: string
  name: string
  loopCount: number
  loopUnlimited: boolean
  items: PlaylistItem[]
}

type Screen = {
  id: string
  name: string
  playlistId: string | null
  createdAt: string
  playlist?: Playlist | null
}

export default function ScreensDashboard() {
  const router = useRouter()
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME' | 'PLAYLIST'>('NEWEST')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Row Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal & Sheet state
  const [selectedDetailScreen, setSelectedDetailScreen] = useState<Screen | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  // Load screens
  const loadScreens = useCallback(async () => {
    try {
      const res = await fetch('/api/screens')
      if (res.ok) {
        const data = await res.json()
        setScreens(data)
      }
    } catch {
      toast.error('Failed to load screens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadScreens()
  }, [loadScreens])

  // Statistics Calculation
  const totalScreens = screens.length
  const assignedScreens = screens.filter((s) => s.playlistId !== null).length
  const unassignedScreens = totalScreens - assignedScreens

  // Filter & Search & Sort logic
  const filteredScreens = screens
    .filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.playlist?.name || 'No Playlist').toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'NAME') return a.name.localeCompare(b.name)
      if (sortBy === 'PLAYLIST') {
        const nameA = a.playlist?.name || 'zzzzzz'
        const nameB = b.playlist?.name || 'zzzzzz'
        return nameA.localeCompare(nameB)
      }
      return 0
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredScreens.length / itemsPerPage)
  const paginatedScreens = filteredScreens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Add Screen
  const handleAddScreen = async () => {
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
    } catch {
      toast.error('Failed to create screen')
    } finally {
      setIsCreating(false)
    }
  }

  // Row operations
  const handleDeleteScreen = async (id: string) => {
    try {
      const res = await fetch(`/api/screens/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Screen deleted successfully')
        setScreens((prev) => prev.filter((s) => s.id !== id))
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
      } else {
        toast.error('Failed to delete screen')
      }
    } catch {
      toast.error('Failed to delete screen')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    let successCount = 0
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/screens/${id}`, { method: 'DELETE' })
        if (res.ok) successCount++
      }
      toast.success(`Deleted ${successCount} screens successfully`)
      setScreens((prev) => prev.filter((s) => !selectedIds.includes(s.id)))
      setSelectedIds([])
    } catch {
      toast.error('Bulk deletion encountered errors')
    } finally {
      setIsBulkDeleteOpen(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedScreens.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedScreens.map((s) => s.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    } else {
      setSelectedIds((prev) => [...prev, id])
    }
  }

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10 px-8 flex flex-col gap-8 antialiased">
      {/* 1. Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Screens</h1>
          <p className="text-xs text-zinc-500 mt-1">Monitor, assign playlists, and view live active screens.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search screens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black w-60 transition-all shadow-sm"
            />
          </div>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
          >
            <option value="NEWEST">Newest Created</option>
            <option value="OLDEST">Oldest Created</option>
            <option value="NAME">Screen Name (A-Z)</option>
            <option value="PLAYLIST">Playlist Name (A-Z)</option>
          </select>

          {/* Add Screen Button */}
          <Button
            onClick={handleAddScreen}
            disabled={isCreating}
            className="bg-black hover:bg-zinc-900 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add Screen
          </Button>
        </div>
      </header>

      {/* 2. Top Statistics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 shrink-0">
        {/* Total Screens */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Screens</span>
            <Monitor className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{totalScreens}</h3>
          <p className="text-[10px] text-zinc-400">Registered presentation displays</p>
        </div>

        {/* Assigned Screens */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Assignments</span>
            <PlaySquare className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none text-blue-600">{assignedScreens}</h3>
          <p className="text-[10px] text-zinc-400">Screens with a playlist configured</p>
        </div>

        {/* Unassigned Screens */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Unassigned Screens</span>
            <Clock className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none text-zinc-500">{unassignedScreens}</h3>
          <p className="text-[10px] text-zinc-400">Screens waiting for playlists</p>
        </div>
      </section>

      {/* 3. Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-black text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 shrink-0">
          <span className="text-xs font-semibold">
            {selectedIds.length} screen{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-xs font-semibold rounded-xl transition-all cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-2xl p-6">
                <DialogHeader>
                  <DialogTitle>Confirm Bulk Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete these {selectedIds.length} selected screens? This action is permanent.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)} className="text-xs">Cancel</Button>
                  <Button onClick={handleBulkDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2">Delete permanently</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* 4. Screens Table */}
      <section className="flex-1 bg-white border border-zinc-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-12 rounded-lg" />
                <Skeleton className="h-6 flex-1 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
              <div className="border-t border-zinc-100 pt-4 space-y-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-zinc-50 last:border-0">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-10 w-10 rounded-lg animate-pulse" />
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <div className="flex-1 flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredScreens.length === 0 && !isCreating ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800">No screens found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
              No screens found matching the search. Create a new screen to get started.
            </p>
            <Button onClick={handleAddScreen} className="mt-6 bg-black hover:bg-zinc-900 text-white font-semibold text-xs py-2 px-5 rounded-xl cursor-pointer">
              Add Screen
            </Button>
          </div>
        ) : (
          /* Table View */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <Table className="relative">
                <TableHeader className="bg-zinc-50 border-b border-zinc-100 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedScreens.length && paginatedScreens.length > 0}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 accent-black rounded cursor-pointer mt-1"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Screen Name</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Assigned Playlist</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Loop Settings</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Created Date</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCreating && (
                    <TableRow className="border-b border-zinc-50 bg-zinc-50/20 animate-pulse">
                      <TableCell className="text-center">
                        <input type="checkbox" disabled className="w-3.5 h-3.5 opacity-30" />
                      </TableCell>
                      <TableCell className="p-4 font-semibold text-zinc-400 text-xs">
                        Creating...
                      </TableCell>
                      <TableCell className="p-4 text-xs text-zinc-400">
                        -
                      </TableCell>
                      <TableCell className="p-4 text-xs text-zinc-400">
                        -
                      </TableCell>
                      <TableCell className="p-4 text-xs text-zinc-400">
                        Just now
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <Skeleton className="h-8 w-16 ml-auto rounded-lg" />
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedScreens.map((screen) => {
                    const isSelected = selectedIds.includes(screen.id)
                    const playlist = screen.playlist
                    const firstDoc = playlist?.items?.[0]?.document
                    return (
                      <TableRow
                        key={screen.id}
                        className={`border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors ${
                          isSelected ? 'bg-zinc-50/80' : ''
                        }`}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(screen.id)}
                            className="w-3.5 h-3.5 accent-black rounded cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="p-4 font-semibold text-zinc-800 text-xs">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-zinc-500" />
                            <span>{screen.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-xs font-semibold text-zinc-800">
                          {playlist ? (
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg(firstDoc?.mimeType || 'application/playlist')} shrink-0 shadow-sm overflow-hidden border border-zinc-100`}>
                                {firstDoc?.mimeType.startsWith('image/') ? (
                                  <img src={firstDoc.s3Url} alt={playlist.name} className="w-full h-full object-cover" />
                                ) : firstDoc?.mimeType.startsWith('video/') ? (
                                  <video src={firstDoc.s3Url} className="w-full h-full object-cover" preload="metadata" muted />
                                ) : (
                                  <PlaySquare className="w-4 h-4 text-zinc-500" />
                                )}
                              </div>
                              <span className="truncate max-w-[200px]" title={playlist.name}>
                                {playlist.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-normal italic">No Playlist Assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="p-4 text-xs font-semibold">
                          {playlist ? (
                            playlist.loopUnlimited ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                                Infinite Loop
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                Loop x{playlist.loopCount}
                              </span>
                            )
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="p-4 text-xs text-zinc-500">
                          {formatDate(screen.createdAt)}
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Live View Redirect (Same Tab) */}
                            <div className="relative group">
                              <button
                                onClick={() => {
                                  const url = playlist 
                                    ? `/view/screen/${screen.id}?playlistId=${playlist.id}`
                                    : `/view/screen/${screen.id}`
                                  router.push(url)
                                }}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max scale-0 rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md transition-all group-hover:scale-100 origin-bottom z-30">
                                Redirect Live
                              </span>
                            </div>

                            {/* Live Play Screen (New Tab) */}
                            <div className="relative group">
                              <button
                                onClick={() => {
                                  const url = playlist 
                                    ? `/view/screen/${screen.id}?playlistId=${playlist.id}`
                                    : `/view/screen/${screen.id}`
                                  window.open(url, '_blank')
                                }}
                                className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max scale-0 rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md transition-all group-hover:scale-100 origin-bottom z-30">
                                Open in New Tab
                              </span>
                            </div>

                            {/* Details sheet */}
                            <div className="relative group">
                              <button
                                onClick={() => setSelectedDetailScreen(screen)}
                                className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max scale-0 rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md transition-all group-hover:scale-100 origin-bottom z-30">
                                Screen Info
                              </span>
                            </div>

                            {/* Delete dialog */}
                            <div className="relative group">
                              <button
                                onClick={() => setDeleteConfirmId(screen.id)}
                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max scale-0 rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md transition-all group-hover:scale-100 origin-bottom z-30">
                                Delete Screen
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <footer className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between shrink-0 bg-white">
                <span className="text-xs text-zinc-500">
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredScreens.length} screens)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              </footer>
            )}
          </div>
        )}
      </section>

      {/* 5. Delete Confirm Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this screen? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="text-xs">Cancel</Button>
            <Button
              onClick={() => deleteConfirmId && handleDeleteScreen(deleteConfirmId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Info Sheet Side Drawer */}
      <Sheet open={selectedDetailScreen !== null} onOpenChange={(open) => !open && setSelectedDetailScreen(null)}>
        <SheetContent className="sm:max-w-md bg-white p-6 overflow-y-auto shadow-2xl flex flex-col gap-6">
          {selectedDetailScreen && (
            <>
              <SheetHeader className="border-b border-zinc-100 pb-4">
                <SheetTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-black" />
                  {selectedDetailScreen.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400">
                  Screen setup and current broadcast configurations.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 flex flex-col gap-5">
                {/* Meta details cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Broadcast State</span>
                    <span className={`text-xs font-semibold ${selectedDetailScreen.playlist ? 'text-green-600' : 'text-zinc-505'}`}>
                      {selectedDetailScreen.playlist ? 'Live Broadcasting' : 'Offline / Idle'}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Created At</span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {new Date(selectedDetailScreen.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Playlist description */}
                {selectedDetailScreen.playlist ? (
                  <div className="flex flex-col gap-3 min-h-[200px]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Assigned Playlist Details
                    </span>
                    <div className="p-4 border border-zinc-150 rounded-xl bg-zinc-50/50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Name:</span>
                        <span className="font-semibold text-zinc-800">{selectedDetailScreen.playlist.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Files Count:</span>
                        <span className="font-semibold text-zinc-800">{selectedDetailScreen.playlist.items.length} files</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Looping:</span>
                        <span className="font-semibold text-zinc-850">
                          {selectedDetailScreen.playlist.loopUnlimited ? 'Unlimited' : `${selectedDetailScreen.playlist.loopCount} loops`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-150">
                    <PlaySquare className="w-8 h-8 text-zinc-300" />
                    <span className="text-xs text-zinc-400 font-semibold mt-2">No Playlist Configured</span>
                    <p className="text-[10px] text-zinc-450 mt-1 max-w-[200px]">
                      Go to Main Screen page to assign a playlist using drag-and-drop.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDetailScreen(null)}
                  className="flex-1 text-xs"
                >
                  Close
                </Button>
                <Button
                  disabled={!selectedDetailScreen.playlistId}
                  onClick={() => {
                    const url = selectedDetailScreen.playlistId 
                      ? `/view/screen/${selectedDetailScreen.id}?playlistId=${selectedDetailScreen.playlistId}`
                      : `/view/screen/${selectedDetailScreen.id}`
                    router.push(url)
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Redirect Live
                </Button>
                <Button
                  disabled={!selectedDetailScreen.playlistId}
                  onClick={() => {
                    const url = selectedDetailScreen.playlistId 
                      ? `/view/screen/${selectedDetailScreen.id}?playlistId=${selectedDetailScreen.playlistId}`
                      : `/view/screen/${selectedDetailScreen.id}`
                    window.open(url, '_blank')
                  }}
                  className="flex-1 bg-black hover:bg-zinc-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Open Tab
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
