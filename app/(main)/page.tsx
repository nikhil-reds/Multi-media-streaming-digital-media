'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  FileIcon as LucideFileIcon,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  Download,
  Eye,
  Info,
  ArrowUpDown,
  Upload,
  Loader2,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle
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

type Document = {
  id: string
  name: string
  mimeType: string
  s3Url: string
  size: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function DocumentsDashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME' | 'SIZE'>('NEWEST')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Row Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal & Sheet state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDetailDoc, setSelectedDetailDoc] = useState<Document | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<{ id: string; file: File }[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // Load documents
  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  // Statistics Calculation
  const totalDocs = documents.length
  const totalSize = documents.reduce((acc, doc) => acc + doc.size, 0)
  const pendingCount = documents.filter((d) => d.status === 'PENDING').length
  const uploadingCount = documents.filter((d) => d.status === 'UPLOADING' || d.status === 'PROCESSING').length
  const completedCount = documents.filter((d) => d.status === 'UPLOADED' || d.status === 'COMPLETED').length

  const recentCount = documents.filter((d) => {
    const hours = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60)
    return hours <= 24
  }).length

  // Filter & Search & Sort logic
  const filteredDocs = documents
    .filter((doc) => {
      // 1. Search filter
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.mimeType.toLowerCase().includes(searchTerm.toLowerCase())
      
      // 2. Status filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && (doc.status === 'UPLOADED' || doc.status === 'COMPLETED')) ||
        (statusFilter === 'PENDING' && doc.status === 'PENDING') ||
        (statusFilter === 'FAILED' && doc.status === 'FAILED') ||
        (statusFilter === 'PROCESSING' && (doc.status === 'UPLOADING' || doc.status === 'PROCESSING'))

      // 3. Type filter
      let matchesType = true
      if (typeFilter !== 'ALL') {
        const mime = doc.mimeType.toLowerCase()
        if (typeFilter === 'PDF') matchesType = mime === 'application/pdf'
        else if (typeFilter === 'IMAGE') matchesType = mime.startsWith('image/')
        else if (typeFilter === 'VIDEO') matchesType = mime.startsWith('video/')
        else if (typeFilter === 'AUDIO') matchesType = mime.startsWith('audio/')
        else if (typeFilter === 'DOCUMENTS') matchesType = mime.startsWith('text/') || mime.includes('word') || mime.includes('spreadsheet') || mime.includes('presentation')
      }

      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'NAME') return a.name.localeCompare(b.name)
      if (sortBy === 'SIZE') return b.size - a.size
      return 0
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Multi-file drag/drop selection handlers
  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const next = Array.from(incoming).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }))
    setUploadFiles((prev) => [...prev, ...next])
  }

  const handleUploadSubmit = async () => {
    if (uploadFiles.length === 0 || isUploading) return
    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    uploadFiles.forEach(({ file }) => formData.append('files', file))

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error('Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })

      toast.success('Documents uploaded successfully')
      setIsUploadOpen(false)
      setUploadFiles([])
      loadDocs()
    } catch {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Row operations
  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Document deleted successfully')
        setDocuments((prev) => prev.filter((d) => d.id !== id))
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
      } else {
        toast.error('Failed to delete document')
      }
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (res.ok) {
        toast.success('Selected documents deleted successfully')
        setDocuments((prev) => prev.filter((d) => !selectedIds.includes(d.id)))
        setSelectedIds([])
      } else {
        toast.error('Bulk deletion failed')
      }
    } catch {
      toast.error('Bulk deletion failed')
    } finally {
      setIsBulkDeleteOpen(false)
    }
  }

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id)
      if (doc) {
        window.open(doc.s3Url, '_blank')
      }
    })
    toast.success(`Triggered download for ${selectedIds.length} files`)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedDocs.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedDocs.map((doc) => doc.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    } else {
      setSelectedIds((prev) => [...prev, id])
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    if (s === 'COMPLETED' || s === 'UPLOADED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      )
    }
    if (s === 'PROCESSING' || s === 'UPLOADING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </span>
      )
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
          <Clock className="w-3 h-3" /> Pending
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
        <AlertCircle className="w-3 h-3" /> Failed
      </span>
    )
  }

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10 px-8 flex flex-col gap-8 antialiased">
      {/* 1. Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Documents</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage and review all uploaded files securely.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search filename, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black w-60 transition-all shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
          >
            <option value="ALL">All Formats</option>
            <option value="PDF">PDF</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="DOCUMENTS">Documents</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm"
          >
            <option value="NEWEST">Newest Uploaded</option>
            <option value="OLDEST">Oldest Uploaded</option>
            <option value="NAME">Alphabetical (A-Z)</option>
            <option value="SIZE">Largest Size</option>
          </select>

          {/* Upload trigger button using Dialog */}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-zinc-900 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl sm:max-w-4xl rounded-2xl bg-white p-0 overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Left panel: Specifications and Instructions (Col Span 5) */}
                <div className="md:col-span-5 bg-zinc-50 p-6 border-r border-zinc-100 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div>
                      <DialogTitle className="text-lg font-bold text-zinc-900">Upload Documents</DialogTitle>
                      <DialogDescription className="text-xs text-zinc-500 mt-1">
                        Select multiple files to import into your workspace catalog.
                      </DialogDescription>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded-xl border border-zinc-150 shadow-sm space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                          Feature Highlight
                        </span>
                        <p className="text-[11px] font-medium text-zinc-700 leading-normal">
                          ⚡ You can drag &amp; drop or select <strong className="text-black">multiple files</strong> at a time for concurrent uploading.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                          Supported Formats
                        </span>

                        <div className="space-y-2 text-[11px]">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold shrink-0">•</span>
                            <p className="text-zinc-650 leading-relaxed">
                              <strong className="text-zinc-900">Images:</strong> PNG, JPG, JPEG, SVG, WebP, GIF, HEIC
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold shrink-0">•</span>
                            <p className="text-zinc-650 leading-relaxed">
                              <strong className="text-zinc-900">Videos:</strong> MP4, MOV, AVI, MKV, WebM
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-red-500 font-bold shrink-0">•</span>
                            <p className="text-zinc-650 leading-relaxed">
                              <strong className="text-zinc-900">Documents:</strong> PDF, DOCX, PPTX, XLSX, TXT, CSV
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <p className="text-zinc-650 leading-relaxed">
                              <strong className="text-zinc-900">Audio:</strong> MP3, WAV, AAC, M4A, OGG
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-400 border-t border-zinc-200/60 pt-4 mt-6">
                    Uploaded assets will be cataloged instantly.
                  </div>
                </div>

                {/* Right panel: Upload Dropzone & Items (Col Span 7) */}
                <div className="md:col-span-7 p-6 flex flex-col justify-between min-h-[400px]">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
                      Dropzone Workspace
                    </span>

                    {/* Upload Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        handleAddFiles(e.dataTransfer.files)
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                        dragOver
                          ? 'border-black bg-zinc-50/50 scale-[0.99] shadow-inner'
                          : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/20'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleAddFiles(e.target.files)}
                      />
                      <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                        <Upload className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-zinc-700">
                          Drag &amp; drop files or <span className="underline text-black">browse</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1">Multi-selection is fully active</p>
                      </div>
                    </div>

                    {/* File List */}
                    {uploadFiles.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Queue ({uploadFiles.length})
                        </span>
                        {uploadFiles.map((fileObj) => (
                          <div
                            key={fileObj.id}
                            className="flex items-center justify-between p-2.5 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <LucideFileIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="text-xs font-semibold text-zinc-700 truncate">{fileObj.file.name}</span>
                              <span className="text-[9px] text-zinc-400 shrink-0 font-mono">({formatBytes(fileObj.file.size)})</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setUploadFiles((prev) => prev.filter((f) => f.id !== fileObj.id))
                              }}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="flex flex-col gap-1.5 p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-semibold leading-none">
                          <span>Uploading files to storage...</span>
                          <span className="font-mono">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black transition-all duration-200 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="mt-6 border-t border-zinc-100 pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsUploadOpen(false)
                        setUploadFiles([])
                      }}
                      className="cursor-pointer text-xs"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadSubmit}
                      className="bg-black hover:bg-zinc-900 text-white font-semibold text-xs px-5 py-2 rounded-xl cursor-pointer disabled:opacity-40"
                      disabled={uploadFiles.length === 0 || isUploading}
                    >
                      {isUploading ? 'Processing...' : `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 2. Top Statistics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 shrink-0">
        {/* Total Documents */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Documents</span>
            <LucideFileIcon className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{totalDocs}</h3>
          <p className="text-[10px] text-zinc-400">Total uploaded files cataloged</p>
        </div>

        {/* Storage Used */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Storage Used</span>
            <HardDrive className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{formatBytes(totalSize)}</h3>
          <div className="flex flex-col gap-1 w-full mt-0.5">
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: `${Math.min(100, (totalSize / (1024 * 1024 * 100)) * 100)}%` }} />
            </div>
            <span className="text-[9px] text-zinc-400 text-right">Limit: 100 MB</span>
          </div>
        </div>

        {/* Processing Status */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Process Status</span>
            <CheckCircle className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{completedCount}</h3>
            <div className="flex flex-col text-right text-[9px] text-zinc-400 leading-tight">
              <span>{pendingCount} Pending</span>
              <span>{uploadingCount} Proc</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            • {completedCount} files finalized
          </p>
        </div>

        {/* File Formats */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Formats Split</span>
            <SlidersHorizontal className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold text-zinc-650 mt-1">
            <span className="bg-zinc-50 p-1 rounded text-center">PDF: {documents.filter(d => d.name.toLowerCase().endsWith('.pdf')).length}</span>
            <span className="bg-zinc-50 p-1 rounded text-center">IMG: {documents.filter(d => d.mimeType.startsWith('image/')).length}</span>
            <span className="bg-zinc-50 p-1 rounded text-center">VID: {documents.filter(d => d.mimeType.startsWith('video/')).length}</span>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recent (24h)</span>
            <Clock className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900 leading-none">{recentCount}</h3>
          <p className="text-[10px] text-zinc-400">Files added in the last 24 hours</p>
        </div>
      </section>

      {/* 3. Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-black text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 shrink-0">
          <span className="text-xs font-semibold">
            {selectedIds.length} document{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download Selected
            </button>
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
                    Are you sure you want to delete these {selectedIds.length} selected documents? This action is permanent and cannot be undone.
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

      {/* 4. Table / Main List Workspace */}
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
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-zinc-50 last:border-0">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-10 w-10 rounded-lg animate-pulse" />
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded" />
                    <div className="flex-1 flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredDocs.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
              <LucideFileIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800">No documents found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
              No files matched your filters or search. Try uploading new documents or resetting filters.
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="mt-6 bg-black hover:bg-zinc-900 text-white font-semibold text-xs py-2 px-5 rounded-xl cursor-pointer"
            >
              Upload First File
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
                        checked={selectedIds.length === paginatedDocs.length && paginatedDocs.length > 0}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 accent-black rounded cursor-pointer mt-1"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">File Name</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Type</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Size</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Status</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Created Date</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4">Tags</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 uppercase tracking-widest p-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocs.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id)
                    return (
                      <TableRow
                        key={doc.id}
                        className={`border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors ${
                          isSelected ? 'bg-zinc-50/80' : ''
                        }`}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(doc.id)}
                            className="w-3.5 h-3.5 accent-black rounded cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="p-4 font-semibold text-zinc-800 text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg(doc.mimeType)} shrink-0 shadow-sm overflow-hidden`}>
                              {doc.mimeType.startsWith('image/') ? (
                                <img src={doc.s3Url} alt={doc.name} className="w-full h-full object-cover" />
                              ) : doc.mimeType.startsWith('video/') ? (
                                <video src={doc.s3Url} className="w-full h-full object-cover" preload="metadata" muted />
                              ) : (
                                <FileIcon mimeType={doc.mimeType} className="w-5 h-5" />
                              )}
                            </div>
                            <span className="truncate max-w-[200px]" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-[10px] font-mono text-zinc-400 uppercase">
                          {doc.mimeType.split('/')[1] || doc.mimeType}
                        </TableCell>
                        <TableCell className="p-4 text-xs font-medium text-zinc-600">
                          {formatBytes(doc.size)}
                        </TableCell>
                        <TableCell className="p-4">{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="p-4 text-xs text-zinc-500">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="p-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-650 text-[10px] font-semibold">
                            media
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Open viewer in new tab */}
                            <button
                              onClick={() => window.open(`/view/${doc.id}`, '_blank')}
                              className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                              title="Open Viewer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* View details (Right Sheet) */}
                            <button
                              onClick={() => setSelectedDetailDoc(doc)}
                              className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                              title="Details"
                            >
                              <Info className="w-4 h-4" />
                            </button>

                            {/* Delete dialog trigger */}
                            <button
                              onClick={() => setDeleteConfirmId(doc.id)}
                              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-zinc-50/50 border-t border-zinc-100 px-6 py-4 flex items-center justify-between shrink-0">
                <span className="text-xs text-zinc-500">
                  Showing {Math.min(filteredDocs.length, (currentPage - 1) * itemsPerPage + 1)}–
                  {Math.min(filteredDocs.length, currentPage * itemsPerPage)} of {filteredDocs.length} files
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="text-xs cursor-pointer"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                          currentPage === p
                            ? 'bg-black text-white'
                            : 'hover:bg-zinc-150 text-zinc-600'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="text-xs cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. Row Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="bg-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action is permanent and all stored assets in S3 will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="text-xs">Cancel</Button>
            <Button
              onClick={() => deleteConfirmId && handleDeleteDoc(deleteConfirmId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Document Details Right Sheet (shadcn Sheet) */}
      <Sheet open={selectedDetailDoc !== null} onOpenChange={(open) => !open && setSelectedDetailDoc(null)}>
        <SheetContent className="bg-white p-6 shadow-2xl w-[400px] border-l border-zinc-200 overflow-y-auto">
          {selectedDetailDoc && (
            <div className="flex flex-col gap-6">
              <SheetHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg(selectedDetailDoc.mimeType)} shadow-sm mb-4`}>
                  <FileIcon mimeType={selectedDetailDoc.mimeType} className="w-6 h-6" />
                </div>
                <SheetTitle className="text-lg font-bold text-zinc-900 truncate leading-tight" title={selectedDetailDoc.name}>
                  {selectedDetailDoc.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400">
                  Document ID: {selectedDetailDoc.id}
                </SheetDescription>
              </SheetHeader>

              {/* Meta information grid */}
              <div className="border-t border-zinc-100 pt-6 space-y-4 text-xs">
                <div className="grid grid-cols-3">
                  <span className="text-zinc-400 font-medium">File Type</span>
                  <span className="col-span-2 text-zinc-800 font-semibold font-mono uppercase">{selectedDetailDoc.mimeType}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-zinc-400 font-medium">File Size</span>
                  <span className="col-span-2 text-zinc-800 font-semibold">{formatBytes(selectedDetailDoc.size)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-zinc-400 font-medium">Created Date</span>
                  <span className="col-span-2 text-zinc-800 font-semibold">{formatDate(selectedDetailDoc.createdAt)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-zinc-400 font-medium">Last Modified</span>
                  <span className="col-span-2 text-zinc-800 font-semibold">{formatDate(selectedDetailDoc.updatedAt)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-zinc-400 font-medium">Uploaded By</span>
                  <span className="col-span-2 text-zinc-800 font-semibold">System Admin</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-zinc-400 font-medium">Tags</span>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-semibold">multimedia</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-semibold">review</span>
                  </div>
                </div>
              </div>

              {/* AI Metadata simulation */}
              <div className="border-t border-zinc-100 pt-6 space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">AI Metadata Insights</h4>
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 text-[11px] text-zinc-650 leading-relaxed font-mono">
                  <p>• Category detection: Media Asset</p>
                  <p>• Content Safety: Approved (100% safe)</p>
                  <p>• Automated tags: rubenius, active_transfers</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="border-t border-zinc-100 pt-6 flex flex-col gap-2.5">
                <a
                  href={selectedDetailDoc.s3Url}
                  download={selectedDetailDoc.name}
                  className="w-full bg-black text-white hover:bg-zinc-900 text-xs font-semibold py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Original File
                </a>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/view/${selectedDetailDoc.id}`, '_blank')}
                  className="w-full text-xs cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                >
                  <Eye className="w-4 h-4" /> View Full Screen
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
