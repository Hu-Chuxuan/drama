import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Loader2, AlertTriangle } from 'lucide-react'
import { SearchTermsNodeData } from '@/types'

export const QuestionNode = memo(function SearchTermsNode({
  data,
}: {
  data: SearchTermsNodeData
}) {
  const handleApprove = (term: string) => {
    if (typeof data.onApprove !== 'function') {
      console.error('No onApprove handler defined')
      return
    }
    data.onApprove(term)
  }

  const hasTerms =
    Array.isArray(data.searchTerms) && data.searchTerms.length > 0

  return (
    <div className='w-[400px]'>
      <Card className='overflow-hidden'>
        <Handle type='target' position={Position.Top} />
        <CardContent className='p-4'>
          {data.loading ? (
            <div className='flex items-center gap-3'>
              <Loader2 className='h-5 w-5 animate-spin text-blue-500' />
              <p>Generating search terms...</p>
            </div>
          ) : data.error ? (
            <div className='flex items-center gap-3 text-red-500'>
              <AlertTriangle className='h-5 w-5' />
              <p>{data.error}</p>
            </div>
          ) : hasTerms ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Search className='h-5 w-5 text-blue-500' />
                <h3 className='font-medium'>Follow-up Queries</h3>
              </div>
              <div className='space-y-2'>
                {data.searchTerms &&
                  data.searchTerms.map((term, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors'
                    >
                      <p className='text-sm text-gray-600 flex-1'>{term}</p>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleApprove(term)}
                        className='h-8 shrink-0'
                        title='Search this term'
                      >
                        <Search className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className='text-center text-gray-500 py-2'>
              <Search className='h-5 w-5 mx-auto mb-2 opacity-40' />
              <p>No suggestions available</p>
            </div>
          )}
        </CardContent>
        <Handle type='source' position={Position.Bottom} />
      </Card>
    </div>
  )
})
