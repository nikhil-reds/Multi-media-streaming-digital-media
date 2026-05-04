'use client'

import { SessionDetail, StatusBadge, formatBytes, formatDate } from './shared'

type Props = {
  selectedId: string | null
  detail: SessionDetail | null
  loading: boolean
}

export default function FilePanel({ selectedId, detail, loading }: Props) {
  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 bg-white">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7h18M3 12h18M3 17h18"
          />
        </svg>
        <p className="text-sm">Select a session to view uploaded files</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex-1 p-8 text-sm text-gray-400 bg-white">Loading files…</div>
  }

  if (!detail) {
    return <div className="flex-1 p-8 text-sm text-red-500 bg-white">Failed to load session.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-6">
        {/* Session header */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Session</h2>
          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
            {detail.id}
          </span>
          <StatusBadge status={detail.status} />
          <span className="text-xs text-gray-400 ml-auto">{formatDate(detail.createdAt)}</span>
        </div>

        {/* File table */}
        {detail.documents.length === 0 ? (
          <p className="text-sm text-gray-400">No files in this session.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Size
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{doc.mimeType}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatBytes(doc.size)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={doc.s3Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-black hover:underline"
                      >
                        View ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
