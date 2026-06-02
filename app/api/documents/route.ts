import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Sign URLs dynamically so they load securely in viewer/previews
    const docsWithPresignedUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          const signedUrl = await getPresignedUrl(doc.s3Bucket, doc.s3Key)
          return { ...doc, s3Url: signedUrl }
        } catch {
          return doc
        }
      })
    )

    return NextResponse.json(docsWithPresignedUrls)
  } catch (error) {
    console.error('[documents GET]', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids: string[] }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'List of document IDs is required' }, { status: 400 })
    }

    const deleted = await prisma.document.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ success: true, count: deleted.count })
  } catch (error) {
    console.error('[documents bulk DELETE]', error)
    return NextResponse.json({ error: 'Failed to perform bulk delete' }, { status: 500 })
  }
}
