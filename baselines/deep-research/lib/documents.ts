import { type Report } from '@/types'
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  Header,
  Footer,
  PageNumber,
} from 'docx'
import jsPDF from 'jspdf'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

export async function generateDocx(report: Report): Promise<Buffer> {
  try {
    console.log(
      'Starting DOCX generation with report:',
      JSON.stringify(report, null, 2)
    )

    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: report.title || 'Untitled Report',
                      size: 48,
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 800 },
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun('Page '),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                    }),
                    new TextRun(' of '),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children: [
            // Summary with increased spacing
            new Paragraph({
              children: [
                new TextRun({
                  text: report.summary || '',
                  size: 24,
                }),
              ],
              spacing: { before: 800, after: 800 },
              alignment: AlignmentType.JUSTIFIED,
            }),
            // Sections with increased spacing
            ...report.sections.flatMap((section) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.title || '',
                    size: 32,
                    bold: true,
                  }),
                ],
                spacing: { before: 800, after: 400 },
                alignment: AlignmentType.LEFT,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.content || '',
                    size: 24,
                  }),
                ],
                spacing: { before: 400, after: 800 },
                alignment: AlignmentType.JUSTIFIED,
              }),
            ]),
          ],
        },
      ],
    })

    console.log('Document instance created')

    try {
      console.log('Starting document packing')
      const buffer = await Packer.toBuffer(doc)
      console.log('Document packed successfully, buffer size:', buffer.length)
      return buffer
    } catch (packError) {
      console.error('Error packing document:', packError)
      throw packError
    }
  } catch (error) {
    console.error('Error in generateDocx:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    throw new Error(
      `Failed to generate DOCX: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

export function generatePdf(report: Report): Buffer {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const contentWidth = pageWidth - 2 * margin

    // Helper function to add text with proper line breaks and page management
    const addText = (
      text: string,
      y: number,
      fontSize: number,
      isBold: boolean = false,
      isJustified: boolean = false,
      isHTML: boolean = false
    ): number => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')

      // If the text contains markdown, convert it to plain text
      let processedText = text
      if (isHTML) {
        // Remove HTML tags but preserve line breaks
        processedText = text
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          // Handle markdown-style bold
          .replace(/\*\*(.*?)\*\*/g, (_, p1) => {
            doc.setFont('helvetica', 'bold')
            const result = p1
            doc.setFont('helvetica', isBold ? 'bold' : 'normal')
            return result
          })
          // Handle markdown-style italic
          .replace(/\*(.*?)\*/g, (_, p1) => {
            doc.setFont('helvetica', 'italic')
            const result = p1
            doc.setFont('helvetica', isBold ? 'bold' : 'normal')
            return result
          })
      }

      const lines = doc.splitTextToSize(processedText, contentWidth)
      const lineHeight = fontSize * 0.3527 // Convert pt to mm

      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage()
          y = margin
        }

        // Handle bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          doc.text('•', margin, y)
          doc.text(line.trim().substring(1), margin + 5, y, {
            align: isJustified ? 'justify' : 'left',
            maxWidth: contentWidth - 5,
          })
        } else {
          doc.text(line, margin, y, {
            align: isJustified ? 'justify' : 'left',
            maxWidth: contentWidth,
          })
        }
        y += lineHeight + 1 // 1mm extra spacing between lines
      })

      return y + lineHeight // Return new Y position
    }

    // Start position
    let currentY = margin

    // Title
    currentY = addText(report.title, currentY, 24, true)
    currentY += 5 // Reduced from 10 to 5

    // Convert markdown to HTML for processing
    const summaryHtml = md.render(report.summary)
    currentY = addText(summaryHtml, currentY, 12, false, true, true)
    currentY += 3 // Reduced from 10 to 3

    // Sections
    report.sections.forEach((section) => {
      currentY += 2 // Reduced from 5 to 2

      // Section title
      currentY = addText(section.title, currentY, 16, true)
      currentY += 2 // Reduced from 5 to 2

      // Convert markdown to HTML for processing
      const contentHtml = md.render(section.content)
      currentY = addText(contentHtml, currentY, 12, false, true, true)
      currentY += 2 // Reduced from 5 to 2
    })

    // Add page numbers
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, {
        align: 'center',
      })
    }

    return Buffer.from(doc.output('arraybuffer'))
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}
