'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Search,
  Trash2,
  Eye,
  Info,
  Clock,
  PlaySquare,
  ListOrdered,
  ListFilter,
  ExternalLink
} from 'lucide-react'
import { FileIcon, iconBg, formatBytes, formatDate } from '@/components/main-screen/shared'
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
    size: number
  }
}

type Playlist = {
  id: string
  name: string
  loopCount: number
  loopUnlimited: boolean
  createdAt: string
  items: PlaylistItem[]
}

export default function PlaylistsDashboard() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME' | 'MOST_FILES'>('NEWEST')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Row Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal & Sheet state
  const [selectedDetailPlaylist, setSelectedDetailPlaylist] = useState<Playlist | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  // Load playlists
  const loadPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists')
      if (res.ok) {
        const data = await res.json()
        setPlaylists(data)
      }
    } catch {
      toast.error('Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  // Statistics Calculation
  const totalPlaylists = playlists.length
  const totalMediaItems = playlists.reduce((acc, p) => acc + (p.items?.length ?? 0), 0)
  const avgItems = totalPlaylists > 0 ? (totalMediaItems / totalPlaylists).toFixed(1) : '0'

  const recentCount = playlists.filter((p) => {
    const hours = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60)
    return hours <= 24
  }).length

  // Filter & Search & Sort logic
  const filteredPlaylists = playlists
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'NAME') return a.name.localeCompare(b.name)
      if (sortBy === 'MOST_FILES') return (b.items?.length ?? 0) - (a.items?.length ?? 0)
      return 0
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredPlaylists.length / itemsPerPage)
  const paginatedPlaylists = filteredPlaylists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Row operations
  const handleDeletePlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Playlist deleted successfully')
        setPlaylists((prev) => prev.filter((p) => p.id !== id))
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
      } else {
        toast.error('Failed to delete playlist')
      }
    } catch {
      toast.error('Failed to delete playlist')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    let successCount = 0
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
        if (res.ok) successCount++
      }
      toast.success(`Deleted ${successCount} playlists successfully`)
      setPlaylists((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      setSelectedIds([])
    } catch {
      toast.error('Bulk deletion encountered errors')
    } finally {
      setIsBulkDeleteOpen(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedPlaylists.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedPlaylists.map((p) => p.id))
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Playlists</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage and view all multimedia playlists.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search playlists..."
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
            <option value="NAME">Alphabetical (A-Z)</option>
            <option value="MOST_FILES">Most Media Files</option>
          </select>

          {/* Create Playlist Link */}
          <Link href="/playlist-builder">
            <Button className="bg-black hover:bg-zinc-900 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
              <PlaySquare className="w-3.5 h-3.5" /> Playlist Builder
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Top Statistics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
        {/* Total Playlists */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Playlists</span>
            <PlaySquare className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{totalPlaylists}</h3>
          <p className="text-[10px] text-zinc-400">Playlists defined in system</p>
        </div>

        {/* Total Media Items */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Media Items Loaded</span>
            <ListOrdered className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{totalMediaItems}</h3>
          <p className="text-[10px] text-zinc-400">Sum of all document assignments</p>
        </div>

        {/* Avg Items / Playlist */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Items / Playlist</span>
            <ListFilter className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{avgItems}</h3>
          <p className="text-[10px] text-zinc-400">Average content count per playlist</p>
        </div>

        {/* Recent Playlists */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recent (24h)</span>
            <Clock className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{recentCount}</h3>
          <p className="text-[10px] text-zinc-400">Playlists created today</p>
        </div>
      </section>

      {/* 3. Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-black text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 shrink-0">
          <span className="text-xs font-semibold">
            {selectedIds.length} playlist{selectedIds.length !== 1 ? 's' : ''} selected
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
                    Are you sure you want to delete these {selectedIds.length} selected playlists? This action is permanent.
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

      {/* 4. Playlists Table */}
      <section className="flex-1 bg-white border border-zinc-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-12 rounded-lg" />
                <Skeleton className="h-6 flex-1 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
              <div className="border-t border-zinc-100 pt-4 space-y-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-zinc-50 last:border-0">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-10 w-10 rounded-lg animate-pulse" />
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded" />
                    <div className="flex-1 flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
              <PlaySquare className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800">No playlists found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
              No playlists found. Try creating a new playlist in the builder.
            </p>
            <Link href="/playlist-builder">
              <Button className="mt-6 bg-black hover:bg-zinc-900 text-white font-semibold text-xs py-2 px-5 rounded-xl cursor-pointer">
                Create Playlist
              </Button>
            </Link>
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
                        checked={selectedIds.length === paginatedPlaylists.length && paginatedPlaylists.length > 0}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 accent-black rounded cursor-pointer mt-1"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Playlist Name</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Items Count</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Loop Mode</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Created Date</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPlaylists.map((p) => {
                    const isSelected = selectedIds.includes(p.id)
                    const firstDoc = p.items?.[0]?.document
                    return (
                      <TableRow
                        key={p.id}
                        className={`border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors ${
                          isSelected ? 'bg-zinc-50/80' : ''
                        }`}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(p.id)}
                            className="w-3.5 h-3.5 accent-black rounded cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="p-4 font-semibold text-zinc-800 text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg(firstDoc?.mimeType || 'application/playlist')} shrink-0 shadow-sm overflow-hidden border border-zinc-100`}>
                              {firstDoc?.mimeType.startsWith('image/') ? (
                                <img src={firstDoc.s3Url} alt={p.name} className="w-full h-full object-cover" />
                              ) : firstDoc?.mimeType.startsWith('video/') ? (
                                <video src={firstDoc.s3Url} className="w-full h-full object-cover" preload="metadata" muted />
                              ) : (
                                <FileIcon mimeType={firstDoc?.mimeType || 'application/playlist'} className="w-5 h-5" />
                              )}
                            </div>
                            <span className="truncate max-w-[200px]" title={p.name}>
                              {p.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-xs font-medium text-zinc-650">
                          {p.items?.length ?? 0} media file{p.items?.length !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="p-4 text-xs font-semibold">
                          {p.loopUnlimited ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                              Infinite Loop
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                              Loop x{p.loopCount}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="p-4 text-xs text-zinc-500">
                          {formatDate(p.createdAt)}
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Play player */}
                            <button
                              onClick={() => window.open(`/view/playlist/${p.id}`, '_blank')}
                              className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                              title="Play Playlist Player"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Details sheet */}
                            <button
                              onClick={() => setSelectedDetailPlaylist(p)}
                              className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                              title="Playlist Info"
                            >
                              <Info className="w-4 h-4" />
                            </button>

                            {/* Delete dialog */}
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Playlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredPlaylists.length} playlists)
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
              Are you sure you want to delete this playlist? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="text-xs">Cancel</Button>
            <Button
              onClick={() => deleteConfirmId && handleDeletePlaylist(deleteConfirmId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Info Sheet Side Drawer */}
      <Sheet open={selectedDetailPlaylist !== null} onOpenChange={(open) => !open && setSelectedDetailPlaylist(null)}>
        <SheetContent className="sm:max-w-md bg-white p-6 overflow-y-auto shadow-2xl flex flex-col gap-6">
          {selectedDetailPlaylist && (
            <>
              <SheetHeader className="border-b border-zinc-100 pb-4">
                <SheetTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <PlaySquare className="w-5 h-5 text-black" />
                  {selectedDetailPlaylist.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400">
                  Playlist details and media assets order sequence.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 flex flex-col gap-5">
                {/* Meta details cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Loop Mode</span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {selectedDetailPlaylist.loopUnlimited ? 'Infinite Loop' : `Loop ${selectedDetailPlaylist.loopCount} times`}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Created At</span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {new Date(selectedDetailPlaylist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Playlist Items List */}
                <div className="flex-1 flex flex-col gap-3 min-h-[250px]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Media Items Sequence ({selectedDetailPlaylist.items?.length ?? 0})
                  </span>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {selectedDetailPlaylist.items?.map((item, idx) => {
                      const doc = item.document
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors relative"
                        >
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                            {idx + 1}
                          </div>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg(doc.mimeType)} shrink-0 shadow-sm overflow-hidden border border-zinc-100 ml-1.5`}>
                            {doc.mimeType.startsWith('image/') ? (
                              <img src={doc.s3Url} alt={doc.name} className="w-full h-full object-cover" />
                            ) : doc.mimeType.startsWith('video/') ? (
                              <video src={doc.s3Url} className="w-full h-full object-cover" preload="metadata" muted />
                            ) : (
                              <FileIcon mimeType={doc.mimeType} className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-800 truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {doc.mimeType.split('/')[1] || doc.mimeType} • {formatBytes(doc.size)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDetailPlaylist(null)}
                  className="flex-1 text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.open(`/view/playlist/${selectedDetailPlaylist.id}`, '_blank')
                  }}
                  className="flex-1 bg-black hover:bg-zinc-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Play
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
