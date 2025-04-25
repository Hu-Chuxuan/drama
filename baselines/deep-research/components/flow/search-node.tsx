import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Loader2, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUPPORTED_FILE_TYPES } from '@/lib/file-upload'
import { SearchNodeData } from '@/types'

export const SearchNode = memo(function SearchNode({
  data,
}: {
  data: SearchNodeData
}) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]

    if (!file) return

    if (!data.onFileUpload) {
      setUploadError('File upload is not available')
      return
    }

    try {
      data.onFileUpload(file)
      e.target.value = ''
    } catch (err) {
      setUploadError(
        `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  return (
    <div className='w-[400px]'>
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between gap-3'>
            {/* Icon and Query Section */}
            <div className='flex items-start gap-3 flex-1 min-w-0'>
              <div className='p-2 rounded-full bg-blue-50'>
                {data.loading ? (
                  <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
                ) : (
                  <Search className='h-4 w-4 text-blue-500' />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='font-medium text-sm text-gray-900'>
                  Search Query
                </h3>
                <p className='text-sm text-gray-600 truncate'>{data.query}</p>
              </div>
            </div>

            {/* Upload Button */}
            {data.onFileUpload && (
              <div className='relative flex-shrink-0'>
                <Input
                  type='file'
                  onChange={handleFileUpload}
                  className='absolute inset-0 opacity-0 cursor-pointer'
                  accept={SUPPORTED_FILE_TYPES}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='pointer-events-none'
                  disabled={data.loading}
                >
                  <Upload className='h-4 w-4 mr-2' />
                  Upload
                </Button>
              </div>
            )}
          </div>

          {uploadError && (
            <div className='mt-2 text-sm text-red-600 flex items-center gap-1'>
              <AlertCircle className='h-3 w-3' />
              <span>{uploadError}</span>
            </div>
          )}
        </CardContent>

        <Handle
          type='source'
          position={Position.Bottom}
          className='!bg-blue-500'
        />
      </Card>
    </div>
  )
})
