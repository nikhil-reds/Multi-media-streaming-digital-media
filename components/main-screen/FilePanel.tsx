'use client'

import { SessionDetail, FileIcon, iconBg } from './shared'

type Props = {
  selectedId: string | null
  detail: SessionDetail | null
  loading: boolean
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
            <p className="text-xs leading-relaxed">Select a playlist to view its documents</p>
          </div>
        ) : loading ? (
          <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
        ) : !detail ? (
          <p className="px-5 py-4 text-sm text-red-400">Failed to load.</p>
        ) : detail.documents.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No documents in this session.</p>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3">
            {detail.documents.map((doc, idx) => (
              <a
                key={doc.id}
                href={doc.s3Url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(doc))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className="flex flex-col items-center gap-2.5 p-3 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group cursor-grab active:cursor-grabbing relative"
              >
                {detail.isPlaylist && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </div>
                )}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBg(doc.mimeType)} overflow-hidden`}>
                  {doc.mimeType.startsWith('image/') ? (
                    <img src={doc.s3Url} alt={doc.name} className="w-full h-full object-cover" />
                  ) : doc.mimeType.startsWith('video/') ? (
                    <video src={doc.s3Url} className="w-full h-full object-cover" preload="metadata" muted />
                  ) : (
                    <FileIcon mimeType={doc.mimeType} />
                  )}
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
