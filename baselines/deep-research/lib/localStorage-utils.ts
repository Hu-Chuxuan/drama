import type { Viewport } from '@xyflow/react'
import type { FlowProject } from '@/hooks/use-flow-projects'

/**
 * Gets the current localStorage usage in bytes and as a percentage of the available space
 */
export function getLocalStorageUsage(): {
  usage: number // Size in bytes
  usagePercent: number // Percentage of available space
  available: number // Estimated available space in bytes
  limit: number // Estimated limit in bytes
} {
  try {
    // Current usage
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || ''
      const value = localStorage.getItem(key) || ''
      totalSize += (key.length + value.length) * 2 // UTF-16 uses 2 bytes per character
    }

    // Estimate of localStorage limit (typically around 5MB)
    const estimatedLimit = 5 * 1024 * 1024 // 5MB in bytes

    return {
      usage: totalSize,
      usagePercent: (totalSize / estimatedLimit) * 100,
      available: Math.max(0, estimatedLimit - totalSize),
      limit: estimatedLimit,
    }
  } catch (error) {
    console.error('Error calculating localStorage usage:', error)
    return {
      usage: 0,
      usagePercent: 0,
      available: 0,
      limit: 0,
    }
  }
}

/**
 * Formats bytes into a human-readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Clears all flow projects from localStorage
 */
export function clearAllFlowProjects(): void {
  localStorage.removeItem('open-deep-research-flow-projects')
  localStorage.removeItem('open-deep-research-current-project')
}

/**
 * Exports all flow projects as a JSON string
 */
export function exportFlowProjects(): string {
  const projects =
    localStorage.getItem('open-deep-research-flow-projects') || '[]'
  return projects
}

/**
 * Imports flow projects from a JSON string
 * Returns success/failure status
 */
export function importFlowProjects(jsonProjects: string): boolean {
  try {
    // Validate JSON format
    const projects = JSON.parse(jsonProjects)

    if (!Array.isArray(projects)) {
      throw new Error('Invalid project data structure')
    }

    // Check if projects have the required structure
    for (const project of projects) {
      if (
        !project.id ||
        !project.name ||
        !project.createdAt ||
        !project.updatedAt
      ) {
        throw new Error('Invalid project data format')
      }
    }

    // Save to localStorage
    localStorage.setItem('open-deep-research-flow-projects', jsonProjects)

    // If there's a current project ID, verify it still exists in the imported data
    const currentProjectId = localStorage.getItem(
      'open-deep-research-current-project'
    )
    if (currentProjectId) {
      const exists = projects.some((p: any) => p.id === currentProjectId)
      if (!exists) {
        localStorage.removeItem('open-deep-research-current-project')
      }
    }

    return true
  } catch (error) {
    console.error('Failed to import projects:', error)
    return false
  }
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

/**
 * Saves viewport state to the current project
 */
export function saveViewportToProject(
  project: FlowProject | null,
  viewport: Viewport,
  updateProject: (data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>) => void
): void {
  if (!project) return

  try {
    updateProject({
      viewport,
    })
  } catch (error) {
    console.error('Failed to save viewport to project:', error)
  }
}

/**
 * Restores viewport state from the current project
 */
export function restoreViewportFromProject(
  project: FlowProject | null,
  setViewport: (viewport: Viewport) => void
): boolean {
  if (!project?.viewport) return false

  try {
    setViewport(project.viewport)
    return true
  } catch (error) {
    console.error('Failed to restore project viewport:', error)
    return false
  }
}

/**
 * Creates a debounced viewport save function
 */
export function createDebouncedViewportSave(
  getViewport: () => Viewport,
  project: FlowProject | null,
  updateProject: (data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>) => void,
  debounceTime: number = 500
): () => void {
  return debounce(() => {
    saveViewportToProject(project, getViewport(), updateProject)
  }, debounceTime)
}

/**
 * Saves nodes to the current project
 */
export function saveNodesToProject<NodeType extends { id: string }>(
  project: FlowProject | null,
  nodes: NodeType[],
  updateProject: (data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>) => void
): void {
  if (!project) return

  try {
    updateProject({
      nodes: nodes as any[],
    })
    console.log(`Nodes saved for project: ${project.name}`)
  } catch (error) {
    console.error('Failed to save nodes to project:', error)
  }
}

/**
 * Saves edges to the current project
 */
export function saveEdgesToProject<EdgeType extends { id: string }>(
  project: FlowProject | null,
  edges: EdgeType[],
  updateProject: (data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>) => void
): void {
  if (!project) return

  try {
    updateProject({
      edges: edges as any[],
    })
    console.log(`Edges saved for project: ${project.name}`)
  } catch (error) {
    console.error('Failed to save edges to project:', error)
  }
}

/**
 * Creates a debounced nodes save function
 */
export function createDebouncedNodesSave<NodeType extends { id: string }>(
  getNodes: () => NodeType[],
  project: FlowProject | null,
  updateProject: (data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>) => void,
  debounceTime: number = 500
): () => void {
  return debounce(() => {
    saveNodesToProject(project, getNodes(), updateProject)
  }, debounceTime)
}

/**
 * Creates a debounced edges save function
 */
export function createDebouncedEdgesSave<EdgeType extends { id: string }>(
  getEdges: () => EdgeType[],
  project: FlowProject | null,
  updateProject: (data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>) => void,
  debounceTime: number = 500
): () => void {
  return debounce(() => {
    saveEdgesToProject(project, getEdges(), updateProject)
  }, debounceTime)
}
