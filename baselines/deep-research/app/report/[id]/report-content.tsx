'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Trash2, AlertTriangle, Brain } from 'lucide-react'
import { type KnowledgeBaseReport } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDistanceToNow } from 'date-fns'
import { useKnowledgeBase } from '@/hooks/use-knowledge-base'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ReportActions } from '@/components/report-actions'
import { CitationsFooter } from '@/components/citations-footer'

export function ReportContent({ id }: any) {
  const router = useRouter()
  const { reports, deleteReport } = useKnowledgeBase()
  const [report, setReport] = useState<KnowledgeBaseReport | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const foundReport = reports.find((r) => r.id === id)
    if (foundReport) {
      setReport(foundReport)
    }
  }, [id, reports])

  const handleDelete = () => {
    if (!report) return
    deleteReport(report.id)
    router.push('/')
  }

  if (!report) {
    return (
      <div className='min-h-screen bg-white p-4 sm:p-8'>
        <div className='max-w-4xl mx-auto'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Report Not Found</AlertTitle>
            <AlertDescription>
              The report you&apos;re looking for doesn&apos;t exist or has been
              deleted.
            </AlertDescription>
          </Alert>
          <div className='mt-4 text-center'>
            <Button
              variant='ghost'
              onClick={() => router.push('/')}
              className='gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8 flex items-center justify-between'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
          <div className='flex gap-2'>
            <ReportActions
              report={report?.report}
              prompt={report?.query}
              size='sm'
              hideKnowledgeBase={true}
            />
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowDeleteConfirm(true)}
              className='gap-2'
            >
              <Trash2 className='h-4 w-4' />
              Delete Report
            </Button>
          </div>
        </div>

        {showDeleteConfirm && (
          <Alert variant='destructive' className='mb-6'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Delete Report?</AlertTitle>
            <AlertDescription className='space-y-2'>
              <p>
                This will permanently delete this report from your knowledge
                base.
              </p>
              <div className='flex gap-2 mt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant='destructive' size='sm' onClick={handleDelete}>
                  Yes, Delete
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className='mb-6'>
          <Brain className='h-4 w-4' />
          <AlertTitle>Knowledge Base Report</AlertTitle>
          <AlertDescription>
            This report was saved{' '}
            {formatDistanceToNow(report.timestamp, { addSuffix: true })}
            in response to the query: &apos;{report.query}&apos;
          </AlertDescription>
        </Alert>

        <Card className='p-6'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>
              {report.report.title}
            </h1>
          </div>

          <div className='prose max-w-none'>
            <h2>Summary</h2>

            {/* Scrollable content area */}
            <div
              className='max-h-[700px] overflow-y-auto pr-2'
              style={{ scrollbarWidth: 'thin' }}
            >
              <p className='mb-6'>{report.report.summary}</p>

              {report.report.sections.map((section, index) => (
                <div key={index} className='mb-6'>
                  <h2>{section.title}</h2>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </div>
              ))}

              {/* Citations Section */}
              <CitationsFooter report={report.report} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
