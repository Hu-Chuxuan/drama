import React from 'react'
import { type Report } from '@/types'

interface CitationsFooterProps {
  report: Report
}

export function CitationsFooter({ report }: CitationsFooterProps) {
  // Filter sources to only include those that were actually used
  const filteredSources = React.useMemo(() => {
    // If usedSources exists, filter the sources to only include those that were cited
    if (report.usedSources && report.usedSources.length > 0 && report.sources) {
      // Convert 1-based indices to 0-based for our array
      const usedIndices = report.usedSources.map((num) => num - 1)
      return report.sources.filter((_, index) =>
        // Check if this source's index is in the usedSources array
        usedIndices.includes(index)
      )
    }
    // Default to all sources if no usedSources specified
    return report.sources
  }, [report.sources, report.usedSources])

  // If no filtered sources, don't render anything
  if (!filteredSources || filteredSources.length === 0) {
    return null
  }

  return (
    <div className='space-y-2 border-t pt-4 mt-6'>
      <h3 className='text-xl font-semibold text-gray-700'>References</h3>
      <ol className='list-decimal pl-5'>
        {filteredSources.map((source) => (
          <li key={source.id} className='mb-1'>
            <a
              href={source.url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 hover:underline'
            >
              {source.name}
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
