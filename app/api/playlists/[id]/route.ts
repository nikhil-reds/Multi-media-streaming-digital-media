import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Generate presigned URLs for each document in the playlist
    const itemsWithPresignedUrls = await Promise.all(
      playlist.items.map(async (item) => {
        try {
          const signedUrl = await getPresignedUrl(item.document.s3Bucket, item.document.s3Key)
          return {
            ...item,
            document: {
              ...item.document,
              s3Url: signedUrl,
            },
          }
        } catch (s3Error) {
          console.error(`Failed to sign URL for document ${item.documentId}:`, s3Error)
          // Fall back to stored URL if signing fails
          return item
        }
      })
    )

    return NextResponse.json({
      ...playlist,
      items: itemsWithPresignedUrls,
    })
  } catch (error) {
    console.error('[playlists detail GET]', error)
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
}
