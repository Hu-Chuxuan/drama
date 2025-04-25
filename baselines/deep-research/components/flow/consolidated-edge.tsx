import { getBezierPath, EdgeProps } from '@xyflow/react'
import { memo } from 'react'

// Define constants for edge styling
const EDGE_STYLES = {
  strokeWidth: 2,
  stroke: '#6366f1', // Indigo color for consolidated edges
  strokeDasharray: '5,5', // Dashed line pattern
}

export const ConsolidatedEdge = memo(function ConsolidatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Combine default edge styles with any custom styles
  const combinedStyles = {
    ...EDGE_STYLES,
    ...style,
  }

  return (
    <path
      id={id}
      style={combinedStyles}
      className='react-flow__edge-path'
      d={edgePath}
      markerEnd={markerEnd}
    />
  )
})
