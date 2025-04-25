import { NextResponse } from 'next/server'
import { parseOfficeAsync } from 'officeparser'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    try {
      // Convert the file to a Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Configure officeparser
      const config = {
        outputErrorToConsole: false,
        newlineDelimiter: '\n',
        ignoreNotes: false,
        putNotesAtLast: false,
      }

      // Parse the document
      const content = await parseOfficeAsync(buffer, config)
      return NextResponse.json({ content })
    } catch (error) {
      console.error('Content extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract content from document' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Document parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    )
  }
}
