import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params
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

    if (!screen) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 })
    }

    return NextResponse.json(screen)
  } catch (error) {
    console.error('[screens detail GET]', error)
    return NextResponse.json({ error: 'Failed to fetch screen' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params
    const body = await request.json()
    const { playlistId, name } = body as { playlistId?: string | null; name?: string }

    const data: any = {}
    if (name !== undefined) {
      data.name = name
    }
    if (playlistId !== undefined) {
      data.playlistId = playlistId
    }

    const updated = await prisma.screen.update({
      where: { id: screenId },
      data,
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[screens PATCH]', error)
    return NextResponse.json({ error: 'Failed to update screen' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params
    await prisma.screen.delete({
      where: { id: screenId },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[screens DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete screen' }, { status: 500 })
  }
}
