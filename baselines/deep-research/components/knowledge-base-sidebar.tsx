import { Brain, Search, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { useKnowledgeBase } from '@/hooks/use-knowledge-base'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface KnowledgeBaseSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KnowledgeBaseSidebar({
  open,
  onOpenChange,
}: KnowledgeBaseSidebarProps) {
  const { reports, searchReports, clearAllReports } = useKnowledgeBase()
  const [searchQuery, setSearchQuery] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filteredReports = searchQuery ? searchReports(searchQuery) : reports

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='left' className='w-[400px] sm:w-[540px]'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle className='flex items-center gap-2'>
              <Brain className='h-6 w-6' />
              Knowledge Base
            </SheetTitle>
          </div>
        </SheetHeader>
        <div className='mt-8 space-y-4'>
          {showClearConfirm && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Clear All Reports?</AlertTitle>
              <AlertDescription className='space-y-2'>
                <p>
                  This will permanently delete all {reports.length} report
                  {reports.length === 1 ? '' : 's'} from your knowledge base.
                </p>
                <div className='flex gap-2 mt-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => {
                      clearAllReports()
                      setShowClearConfirm(false)
                    }}
                  >
                    Yes, Clear All
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {reports.length > 0 && !showClearConfirm && (
            <Alert>
              <AlertTitle className='font-semibold'>Current Status</AlertTitle>
              <AlertDescription>
                You have {reports.length} saved report
                {reports.length === 1 ? '' : 's'}. Click on a report to view
                details or use the search to find specific reports.
              </AlertDescription>
            </Alert>
          )}
          <div className='relative'>
            <Input
              type='text'
              placeholder='Search saved reports...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pr-8'
            />
            <Search className='absolute right-2 top-2.5 h-4 w-4 text-gray-400' />
          </div>
          <ScrollArea className='h-[calc(100vh-280px)]'>
            <div className='space-y-2'>
              {filteredReports.map((savedReport) => (
                <Card
                  key={savedReport.id}
                  className='p-4 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex justify-between items-start gap-2'>
                    <Link
                      href={`/report/${savedReport.id}`}
                      className='flex-1 min-w-0 cursor-pointer'
                    >
                      <h3 className='font-semibold truncate'>
                        {savedReport.report.title}
                      </h3>
                      <p className='text-sm text-gray-500 truncate'>
                        {savedReport.query}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {formatDistanceToNow(savedReport.timestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </Link>
                  </div>
                </Card>
              ))}
              {filteredReports.length === 0 && (
                <Alert variant='destructive'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertTitle>No Reports Found</AlertTitle>
                  <AlertDescription>
                    {searchQuery
                      ? 'No reports match your search query. Try a different search term.'
                      : 'Your knowledge base is empty. Save some reports to get started.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className='absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <Button
            variant='ghost'
            onClick={() => setShowClearConfirm(true)}
            className='relative w-full rounded-none h-16 hover:bg-destructive/10'
          >
            <div className='absolute left-4 top-1/2 -translate-y-1/2'>
              <div className='relative'>
                <Trash2 className='h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors' />
              </div>
            </div>
            <span className='text-sm font-medium text-muted-foreground group-hover:text-destructive transition-colors'>
              Clear All Reports
            </span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
