import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'
import PlaylistPlayer from './PlaylistPlayer'

async function fetchPlaylist(id: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          document: true,
        },
      },
    },
  })
  if (!playlist) return null

  const items = await Promise.all(
    playlist.items.map(async (item) => {
      try {
        const signedUrl = await getPresignedUrl(item.document.s3Bucket, item.document.s3Key)
        return {
          id: item.document.id,
          name: item.document.name,
          mimeType: item.document.mimeType,
          s3Url: signedUrl,
          order: item.order,
        }
      } catch (err) {
        console.error('Error signing URL for playlist item:', err)
        return {
          id: item.document.id,
          name: item.document.name,
          mimeType: item.document.mimeType,
          s3Url: item.document.s3Url,
          order: item.order,
        }
      }
    })
  )

  return {
    id: playlist.id,
    name: playlist.name,
    items,
  }
}

export default async function PlaylistViewerPage({
  params,
}: {
  params: Promise<{ playlistId: string }>
}) {
  const { playlistId } = await params
  const playlist = await fetchPlaylist(playlistId)
  if (!playlist) notFound()

  return (
    <PlaylistPlayer playlist={playlist} />
  )
}
