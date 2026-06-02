import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadBuffer } from '@/lib/s3'

export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            document: true,
          },
        },
      },
    })
    return NextResponse.json(playlists)
  } catch (error) {
    console.error('[playlists GET]', error)
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, documentIds, loopCount, loopUnlimited } = body as {
      name: string
      documentIds: string[]
      loopCount?: number
      loopUnlimited?: boolean
    }

    if (!name || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Name and a non-empty list of documentIds are required' }, { status: 400 })
    }

    // Fetch documents to verify they exist and get metadata
    const documents = await prisma.document.findMany({
      where: { id: { in: documentIds } },
    })

    if (documents.length === 0) {
      return NextResponse.json({ error: 'No valid documents found' }, { status: 400 })
    }

    // Maintain the order specified in documentIds
    const orderedDocs = documentIds
      .map((id) => documents.find((d) => d.id === id))
      .filter((d): d is typeof documents[0] => !!d)

    const playlistId = crypto.randomUUID()
    const bucketName = process.env.BUCKET_NAME!
    const key = `playlists/${playlistId}.json`

    const resolvedLoopCount = typeof loopCount === 'number' ? loopCount : 1
    const resolvedLoopUnlimited = typeof loopUnlimited === 'boolean' ? loopUnlimited : true

    const playlistJson = {
      id: playlistId,
      name,
      loopCount: resolvedLoopCount,
      loopUnlimited: resolvedLoopUnlimited,
      createdAt: new Date().toISOString(),
      items: orderedDocs.map((doc, idx) => ({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        s3Url: doc.s3Url,
        order: idx,
      })),
    }

    const buffer = Buffer.from(JSON.stringify(playlistJson, null, 2))
    const s3Url = await uploadBuffer(buffer, bucketName, key, 'application/json')

    // Create the playlist in the database
    const playlist = await prisma.playlist.create({
      data: {
        id: playlistId,
        name,
        loopCount: resolvedLoopCount,
        loopUnlimited: resolvedLoopUnlimited,
        s3Bucket: bucketName,
        s3Key: key,
        s3Url,
        items: {
          create: orderedDocs.map((doc, idx) => ({
            documentId: doc.id,
            order: idx,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            document: true,
          },
        },
      },
    })

    return NextResponse.json(playlist, { status: 201 })
  } catch (error) {
    console.error('[playlists POST]', error)
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
  }
}
