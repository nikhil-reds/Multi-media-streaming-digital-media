'use client'

import { SessionDetail } from './shared'

type Props = {
  selectedId: string | null
  detail: SessionDetail | null
  loading: boolean
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return (
      <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    )
  }
  if (mimeType === 'application/pdf') {
    return (
      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6M9 17h4" />
      </svg>
    )
  }
  if (mimeType.startsWith('video/')) {
    return (
      <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    )
  }
  if (mimeType.startsWith('audio/')) {
    return (
      <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
      </svg>
    )
  }
  return (
    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function iconBg(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'bg-blue-50'
  if (mimeType === 'application/pdf') return 'bg-red-50'
  if (mimeType.startsWith('video/')) return 'bg-purple-50'
  if (mimeType.startsWith('audio/')) return 'bg-green-50'
  return 'bg-gray-100'
}

export default function FilePanel({ selectedId, detail, loading }: Props) {
  return (
    <aside className="w-72 shrink-0 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          Documents
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center text-gray-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs leading-relaxed">Select a session to view its documents</p>
          </div>
        ) : loading ? (
          <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
        ) : !detail ? (
          <p className="px-5 py-4 text-sm text-red-400">Failed to load.</p>
        ) : detail.documents.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No documents in this session.</p>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3">
            {detail.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.s3Url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2.5 p-3 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBg(doc.mimeType)}`}>
                  <FileIcon mimeType={doc.mimeType} />
                </div>
                <span className="text-xs text-gray-600 text-center leading-snug line-clamp-2 break-all group-hover:text-black w-full">
                  {doc.name}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
