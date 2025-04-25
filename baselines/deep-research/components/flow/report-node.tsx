import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { ReportNodeData } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReportActions } from '@/components/report-actions'
import { Checkbox } from '@/components/ui/checkbox'
import { CitationsFooter } from '@/components/citations-footer'

export const ReportNode = memo(function ReportNode({
  id,
  data,
}: {
  id: string
  data: ReportNodeData
}) {
  const {
    report,
    loading,
    error,
    isSelected,
    isConsolidated,
    onSelect,
    isConsolidating,
  } = data

  return (
    <div className='w-[600px]'>
      <Handle type='target' position={Position.Top} />
      <Card
        className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${
          isConsolidated ? 'border border-yellow-500' : ''
        }`}
      >
        <CardContent className='p-6 space-y-4'>
          {loading ? (
            <div className='flex items-center justify-center p-4'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : error ? (
            <div className='flex items-center gap-2 text-red-500 text-center p-4'>
              <AlertTriangle className='h-5 w-5' />
              <span>{error}</span>
            </div>
          ) : report ? (
            <div className='space-y-4'>
              <div className='flex items-baseline gap-3'>
                {onSelect && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(id)}
                    disabled={isConsolidating}
                  />
                )}
                <h2 className='text-xl font-bold text-gray-800'>
                  {report.title}
                </h2>
              </div>

              <div className='flex justify-start'>
                <ReportActions report={report} size='sm' />
              </div>

              <div className='max-h-[500px] overflow-y-auto pr-2 nowheel nodrag'>
                <p className='text-gray-700 mb-4'>{report.summary}</p>

                {report.sections?.map((section, index) => (
                  <div key={index} className='space-y-2 border-t pt-4 mb-4'>
                    <h3 className='text-lg font-semibold text-gray-700'>
                      {section.title}
                    </h3>
                    <div className='prose max-w-none text-gray-600'>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}

                {/* Citations Section */}
                <CitationsFooter report={report} />
              </div>
            </div>
          ) : (
            <div className='text-gray-500 text-center p-4'>
              No report data available
            </div>
          )}
        </CardContent>
      </Card>
      <Handle type='source' position={Position.Bottom} />
    </div>
  )
})
