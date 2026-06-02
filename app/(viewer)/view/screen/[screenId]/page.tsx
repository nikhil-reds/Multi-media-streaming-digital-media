import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'
import ScreenPlayer from './ScreenPlayer'

async function fetchScreenWithPlaylist(screenId: string) {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    include: {
      playlist: {
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: {
              document: true,
            },
          },
        },
      },
    },
  })

  if (!screen) return null

  const playlist = screen.playlist
  if (!playlist) {
    return {
      screen,
      playlist: null,
    }
  }

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
        console.error('Error signing URL for screen playlist item:', err)
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
    screen,
    playlist: {
      id: playlist.id,
      name: playlist.name,
      loopCount: playlist.loopCount,
      loopUnlimited: playlist.loopUnlimited,
      items,
    },
  }
}

export default async function ScreenViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ screenId: string }>
  searchParams: Promise<{ playlistId?: string }>
}) {
  const { screenId } = await params
  const { playlistId: urlPlaylistId } = await searchParams

  const data = await fetchScreenWithPlaylist(screenId)
  if (!data) notFound()

  // Attach the playlist id in the URL if it exists but is not currently present in searchParams
  if (data.playlist && data.playlist.id !== urlPlaylistId) {
    redirect(`/view/screen/${screenId}?playlistId=${data.playlist.id}`)
  }

  return (
    <ScreenPlayer
      screenName={data.screen.name}
      playlist={data.playlist}
    />
  )
}
