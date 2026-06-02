import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'
import CloseButton from './CloseButton'
import UniversalMediaViewer from '@/components/UniversalMediaViewer'

async function fetchDoc(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, name: true, mimeType: true, s3Bucket: true, s3Key: true },
  })
  if (!doc) return null
  const signedUrl = await getPresignedUrl(doc.s3Bucket, doc.s3Key)
  return { id: doc.id, name: doc.name, mimeType: doc.mimeType, s3Url: signedUrl }
}

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ docId: string }>
}) {
  const { docId } = await params
  const doc = await fetchDoc(docId)
  if (!doc) notFound()

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 shrink-0 rounded-full bg-green-400" />
          <span className="text-sm text-white/80 font-medium truncate">
            {doc.name}
          </span>
          <span className="text-xs text-white/30 font-mono shrink-0">{doc.mimeType}</span>
        </div>
        <CloseButton />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <UniversalMediaViewer doc={doc} />
      </div>
    </div>
  )
}
