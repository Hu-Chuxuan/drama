import { memo, useState, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { SearchResult, SelectionNodeData } from '@/types'
import { CONFIG } from '@/lib/config'

const MAX_SELECTIONS = CONFIG.search.maxSelectableResults

export const SelectionNode = memo(function SelectionNode({
  data,
}: {
  data: SelectionNodeData
}) {
  const [selectedResults, setSelectedResults] = useState<SearchResult[]>([])
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Reset selection when results change
  useEffect(() => {
    setSelectedResults([])
    setError(null)
  }, [data.results])

  const handleSelect = (result: SearchResult) => {
    setSelectedResults((prev) => {
      if (prev.find((r) => r.id === result.id)) {
        return prev.filter((r) => r.id !== result.id)
      }
      if (prev.length >= MAX_SELECTIONS) return prev
      return [...prev, result]
    })
  }

  const handleGenerateReport = () => {
    if (selectedResults.length === 0) {
      setError('Please select at least one result')
      return
    }

    // Clear any previous errors
    setError(null)

    // Check if onGenerateReport is defined
    if (typeof data.onGenerateReport !== 'function') {
      setError('Report generation is not available')
      return
    }

    setIsGenerating(true)

    try {
      // Call onGenerateReport and capture the result
      const result = data.onGenerateReport(selectedResults, prompt)

      // Check if the result is a Promise using Promise.resolve
      Promise.resolve(result)
        .then(() => {
          // Report generation completed successfully
        })
        .catch((err) => {
          setError(
            `Error generating report: ${
              err instanceof Error ? err.message : 'Unknown error'
            }`
          )
        })
        .finally(() => {
          setIsGenerating(false)
        })
    } catch (err) {
      setIsGenerating(false)
      setError(
        `Error generating report: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      )
    }
  }

  const isSelectionValid = selectedResults.length > 0 && !error

  return (
    <div className='w-auto max-w-[600px] mx-auto'>
      <Card>
        <Handle type='target' position={Position.Top} />
        <CardContent className='p-6'>
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h3 className='font-medium text-lg flex items-center gap-3'>
                <FileText className='h-6 w-6 text-blue-500' />
                Search Results
              </h3>
              <Button
                size='default'
                disabled={!isSelectionValid || isGenerating}
                onClick={handleGenerateReport}
                className='gap-2'
              >
                {isGenerating ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <FileText className='h-4 w-4' />
                )}
                {isGenerating
                  ? 'Generating...'
                  : `Generate Report (${selectedResults.length})`}
              </Button>
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 p-3 rounded-md flex items-center gap-2 text-red-700'>
                <AlertTriangle className='h-4 w-4' />
                <p className='text-sm'>{error}</p>
              </div>
            )}

            <p className='text-gray-600'>
              Select up to {MAX_SELECTIONS} results to analyze (
              {selectedResults.length} selected)
            </p>

            {selectedResults.length > 0 && (
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='What would you like to know about these sources?'
              />
            )}

            <div className='space-y-4 max-h-[400px] overflow-y-auto pr-4 nowheel nodrag'>
              {data.results.map((result) => (
                <div
                  key={result.id}
                  className='flex items-start gap-4 bg-gray-50 p-4 rounded-lg'
                >
                  <div className='pt-1'>
                    <Checkbox
                      checked={selectedResults.some((r) => r.id === result.id)}
                      onCheckedChange={() => handleSelect(result)}
                      disabled={
                        (!selectedResults.some((r) => r.id === result.id) &&
                          selectedResults.length >= MAX_SELECTIONS) ||
                        isGenerating
                      }
                    />
                  </div>
                  <div className='space-y-2 flex-1'>
                    <a
                      href={result.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline font-medium block'
                    >
                      {result.name}
                    </a>
                    <p className='text-sm text-green-700 truncate'>
                      {result.url}
                    </p>
                    <p className='text-gray-600 line-clamp-3'>
                      {result.snippet}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <Handle type='source' position={Position.Bottom} />
      </Card>
    </div>
  )
})
