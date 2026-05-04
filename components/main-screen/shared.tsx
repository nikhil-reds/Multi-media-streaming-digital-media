export type Session = {
  id: string
  status: string
  createdAt: string
  _count: { documents: number }
}

export type Document = {
  id: string
  name: string
  size: number
  mimeType: string
  s3Url: string
  status: string
}

export type SessionDetail = {
  id: string
  status: string
  createdAt: string
  documents: Document[]
}

export const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  UPLOADED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  UPLOADING: 'bg-yellow-100 text-yellow-700',
  PENDING: 'bg-gray-100 text-gray-500',
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-500'}`}
    >
      {status}
    </span>
  )
}
