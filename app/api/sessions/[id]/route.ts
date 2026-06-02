import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await prisma.session.findUnique({
    where: { id },
    include: { documents: true },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Generate S3 presigned URLs for each document in the session
  const documentsWithPresignedUrls = await Promise.all(
    session.documents.map(async (doc) => {
      try {
        const signedUrl = await getPresignedUrl(doc.s3Bucket, doc.s3Key)
        return {
          ...doc,
          s3Url: signedUrl,
        }
      } catch (err) {
        console.error(`Failed to generate signed URL for doc ${doc.id}:`, err)
        return doc
      }
    })
  )

  return NextResponse.json({
    ...session,
    documents: documentsWithPresignedUrls,
  })
}
