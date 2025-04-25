import { Button } from '@/components/ui/button'
import { Brain, Download, Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useKnowledgeBase } from '@/hooks/use-knowledge-base'
import type { Report } from '@/types'

interface ReportActionsProps {
  report: Report
  prompt?: string
  size?: 'default' | 'sm'
  variant?: 'default' | 'outline'
  className?: string
  hideKnowledgeBase?: boolean
}

export function ReportActions({
  report,
  prompt,
  size = 'sm',
  variant = 'outline',
  className = '',
  hideKnowledgeBase = false,
}: ReportActionsProps) {
  const { addReport, reports } = useKnowledgeBase()
  const { toast } = useToast()

  // Check if report is already saved by comparing title and summary
  const isReportSaved = reports.some(
    (savedReport) =>
      savedReport.report.title === report.title &&
      savedReport.report.summary === report.summary
  )

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          format,
        }),
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Download failed',
        variant: 'destructive',
      })
    }
  }

  const handleSaveToKnowledgeBase = () => {
    if (isReportSaved) return
    const success = addReport(report, prompt || '')
    if (success) {
      toast({
        title: 'Saved to Knowledge Base',
        description: 'The report has been saved for future reference',
      })
    }
  }

  const handleCopy = async () => {
    try {
      let formattedContent = `${report.title}\n\n${
        report.summary
      }\n\n${report.sections
        .map((section) => `${section.title}\n${section.content}`)
        .join('\n\n')}`

      // Filter sources if usedSources is available
      const filteredSources =
        report.usedSources && report.usedSources.length > 0 && report.sources
          ? report.sources.filter((_, index) =>
              report.usedSources!.map((num) => num - 1).includes(index)
            )
          : report.sources

      // Add citations if filtered sources are available
      if (filteredSources && filteredSources.length > 0) {
        formattedContent +=
          '\n\nReferences:\n' +
          filteredSources
            .map(
              (source, index) => `${index + 1}. ${source.name} - ${source.url}`
            )
            .join('\n')
      }

      await navigator.clipboard.writeText(formattedContent)
      toast({
        title: 'Copied',
        description: 'Report content copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description:
          error instanceof Error ? error.message : 'Failed to copy content',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        className='gap-2'
        onClick={handleCopy}
        title='Copy report'
      >
        <Copy className='h-4 w-4' />
        <span className='hidden sm:inline'>Copy</span>
      </Button>
      {!hideKnowledgeBase && (
        <Button
          variant={variant}
          size={size}
          className='gap-2'
          onClick={handleSaveToKnowledgeBase}
          disabled={isReportSaved}
          title={isReportSaved ? 'Already saved' : 'Save to Knowledge Base'}
        >
          <Brain className='h-4 w-4' />
          <span className='hidden sm:inline'>
            {isReportSaved ? 'Saved' : 'Save to Knowledge Base'}
          </span>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className='gap-2'
            title='Download'
          >
            <Download className='h-4 w-4' />
            <span className='hidden sm:inline'>Download</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={() => handleDownload('pdf')}>
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload('docx')}>
            Download as Word
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload('txt')}>
            Download as Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
