import { NextResponse } from 'next/server'
import { generateDocx, generatePdf } from '@/lib/documents'
import { type Report } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Download request received:', {
      format: body.format,
      reportTitle: body.report?.title
    })

    const { report, format } = body as { report: Report; format: 'pdf' | 'docx' | 'txt' }

    let content: string | Buffer
    const headers = new Headers()

    switch (format) {
      case 'pdf':
        console.log('Generating PDF')
        content = await generatePdf(report)
        headers.set('Content-Type', 'application/pdf')
        break

      case 'docx':
        console.log('Generating DOCX')
        content = await generateDocx(report)
        headers.set(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        break

      case 'txt':
      default:
        console.log('Generating TXT')
        content = `
${report.title}

${report.summary}

${report.sections
  .map(
    (section) => `
${section.title}
${section.content}
`
  )
  .join('\n')}
`.trim()
        headers.set('Content-Type', 'text/plain')
        break
    }

    console.log(`Generated ${format} content, size:`, content.length)
    headers.set('Content-Disposition', `attachment; filename=report.${format}`)

    return new Response(content, {
      headers,
      status: 200,
    })
  } catch (error) {
    console.error('Download generation error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Failed to generate download' },
      { status: 500 }
    )
  }
} 