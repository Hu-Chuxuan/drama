'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  Node,
  Edge,
  Connection,
  NodeTypes,
  NodeChange,
  EdgeChange,
  XYPosition,
  EdgeTypes,
  CoordinateExtent,
} from '@xyflow/react'
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Brain, Search, FileText, Loader2, AlertTriangle } from 'lucide-react'
import { SearchNode } from '@/components/flow/search-node'
import { ReportNode } from '@/components/flow/report-node'
import { SelectionNode } from '@/components/flow/selection-node'
import { QuestionNode } from '@/components/flow/question-node'
import { ConsolidatedEdge } from '@/components/flow/consolidated-edge'
import type { SearchResult, Report, FlowNodeData, NodeConfig } from '@/types'
import { ModelSelect, DEFAULT_MODEL } from '@/components/model-select'
import { handleLocalFile } from '@/lib/file-upload'
import { useToast } from '@/hooks/use-toast'
import { useFlowProjects } from '@/hooks/use-flow-projects'
import { ProjectSelector } from '@/components/flow/project-selector'
import Link from 'next/link'
import { ProjectActions } from '@/components/flow/project-actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Import the new utility functions
import {
  createDebouncedViewportSave,
  createDebouncedNodesSave,
  createDebouncedEdgesSave,
} from '@/lib/localStorage-utils'

// Constants for localStorage keys - Now using project-based viewport storage

// Node type definitions
const nodeTypes: NodeTypes = {
  searchNode: SearchNode,
  reportNode: ReportNode,
  selectionNode: SelectionNode,
  questionNode: QuestionNode,
}

const edgeTypes: EdgeTypes = {
  consolidated: ConsolidatedEdge,
}

// Extend Node with our FlowNodeData
interface ResearchNode extends Node {
  data: FlowNodeData
  style?: React.CSSProperties
  extent?: 'parent' | CoordinateExtent
}

// Configuration for different node types - centralized configuration
const NODE_CONFIG: Record<string, NodeConfig> = {
  group: {
    zIndex: 0,
    style: {
      width: 800,
      height: 1600,
      padding: 60,
      backgroundColor: 'rgba(240, 240, 240, 0.5)',
      borderRadius: 8,
    },
  },
  searchNode: { zIndex: 1 },
  selectionNode: { zIndex: 2 },
  reportNode: { zIndex: 3 },
  questionNode: { zIndex: 3 },
}

// Custom hook for handling the research workflow
function useResearchFlow(
  createNode: (
    type: string,
    position: XYPosition,
    data: Partial<FlowNodeData>,
    parentId?: string
  ) => ResearchNode,
  setNodes: React.Dispatch<React.SetStateAction<ResearchNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  selectedModel: string,
  edges: Edge[],
  query: string,
  selectedReports: string[],
  saveCurrentState: (
    nodes: Node[],
    edges: Edge[],
    query: string,
    selectedReports: string[]
  ) => void,
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  simpleSave?: (
    nodes: Node[],
    edges: Edge[],
    query: string,
    selectedReports: string[]
  ) => void
) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Centralized function to handle API errors
  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`${context} error:`, error)
    return error instanceof Error ? error.message : String(error)
  }, [])

  // Handle file upload for search nodes
  const handleFileUpload = useCallback(
    async (file: File, searchNodeId: string, groupId: string) => {
      const result = await handleLocalFile(
        file,
        (loading) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === searchNodeId
                ? { ...node, data: { ...node.data, loading } }
                : node
            )
          )
        },
        (error, context) => {
          toast({
            title: context,
            description: error instanceof Error ? error.message : String(error),
            variant: 'destructive',
          })
        }
      )

      if (result) {
        setNodes((nds) => {
          const selectionNode = nds.find(
            (n) => n.type === 'selectionNode' && n.parentId === groupId
          )

          if (selectionNode) {
            return nds.map((node) =>
              node.id === selectionNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      results: [result, ...(node.data.results || [])],
                    },
                  }
                : node.id === searchNodeId
                ? { ...node, data: { ...node.data, loading: false } }
                : node
            )
          }

          const newSelectionNode = createNode(
            'selectionNode',
            { x: 100, y: 200 },
            {
              results: [result],
              onGenerateReport: (selected, prompt) => {
                return handleGenerateReport(
                  selected,
                  searchNodeId,
                  groupId,
                  prompt
                )
              },
              childIds: [],
            },
            groupId
          )

          return [
            ...nds.map((n) =>
              n.id === searchNodeId
                ? { ...n, data: { ...n.data, loading: false } }
                : n
            ),
            newSelectionNode,
          ]
        })
      }
    },
    [createNode, setNodes, toast]
  )

  // Generate a report from selected search results
  const handleGenerateReport = useCallback(
    async (
      selectedResults: SearchResult[],
      searchNodeId: string,
      groupId: string,
      prompt: string
    ) => {
      if (selectedResults.length === 0) {
        return
      }

      const reportNode = createNode(
        'reportNode',
        { x: 100, y: 800 },
        {
          loading: true,
          hasChildren: false,
        },
        groupId
      )

      const searchTermsNode = createNode(
        'questionNode',
        { x: 100, y: 1000 },
        {
          loading: true,
        },
        groupId
      )

      setNodes((nds) => [...nds, reportNode, searchTermsNode])

      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${searchNodeId}-${reportNode.id}`,
          source: searchNodeId,
          target: reportNode.id,
          animated: true,
        },
        {
          id: `edge-${reportNode.id}-${searchTermsNode.id}`,
          source: reportNode.id,
          target: searchTermsNode.id,
          animated: true,
        },
      ])

      try {
        // Process content for all selected results
        const contentResults = await Promise.all(
          selectedResults.map(async (result) => {
            if (result.content) {
              return {
                url: result.url,
                title: result.name,
                content: result.content,
              }
            }

            try {
              const response = await fetch('/api/fetch-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: result.url }),
              })

              if (!response.ok) throw new Error('Failed to fetch content')

              const { content } = await response.json()
              return {
                url: result.url,
                title: result.name,
                content: content || result.snippet,
              }
            } catch (error) {
              console.log('Error fetching content:', error)
              return {
                url: result.url,
                title: result.name,
                content: result.snippet,
              }
            }
          })
        )

        const validResults = contentResults.filter((r) => r.content?.trim())
        if (validResults.length === 0) {
          throw new Error('No valid content found in selected results')
        }

        // Generate report
        const reportResponse = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedResults: validResults,
            sources: selectedResults,
            prompt:
              prompt ||
              'Provide comprehensive analysis of the selected sources.',
            platformModel: selectedModel,
          }),
        })

        if (!reportResponse.ok) {
          const errorData = await reportResponse
            .json()
            .catch(() => ({ error: 'Failed to generate report' }))
          throw new Error(
            errorData.error ||
              `Failed to generate report: ${reportResponse.status}`
          )
        }

        const report = await reportResponse.json()

        // Generate search terms
        const searchTermsResponse = await fetch('/api/generate-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report,
            platformModel: selectedModel,
          }),
        })

        if (!searchTermsResponse.ok) {
          const errorData = await searchTermsResponse
            .json()
            .catch(() => ({ error: 'Failed to generate search terms' }))
          throw new Error(
            errorData.error ||
              `Failed to generate search terms: ${searchTermsResponse.status}`
          )
        }

        const { searchTerms } = await searchTermsResponse.json()

        // Update nodes with results
        let updatedNodes: Node[] = []

        setNodes((nds) => {
          const newNodes = nds.map((node) => {
            if (node.id === reportNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  report,
                  loading: false,
                },
              }
            }
            if (node.id === searchTermsNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  searchTerms,
                  loading: false,
                  onApprove: (term?: string) => {
                    if (term) {
                      setQuery(term)
                      toast({
                        title: 'Search query updated',
                        description: `Updated search query to: "${term}"`,
                      })
                    }
                    return term
                  },
                },
              }
            }
            return node
          })

          updatedNodes = newNodes
          return newNodes
        })

        // FORCE IMMEDIATE SAVE after nodes are updated
        // This is critical - we save directly to localStorage to ensure report data isn't lost
        setTimeout(() => {
          if (simpleSave) {
            simpleSave(updatedNodes, edges, query, selectedReports)
            console.log('🔥 FORCE SAVED REPORT DATA TO LOCALSTORAGE!')
          } else {
            console.warn('simpleSave function not available')
            // Fallback to regular save
            saveCurrentState(updatedNodes, edges, query, selectedReports)
          }
        }, 100)

        return { success: true, report, searchTerms }
      } catch (error) {
        const errorMsg = handleApiError(error, 'Report generation')

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === reportNode.id || node.id === searchTermsNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  loading: false,
                  error: errorMsg,
                },
              }
            }
            return node
          })
        )
        return { success: false, error: errorMsg }
      }
    },
    [
      createNode,
      setNodes,
      setEdges,
      edges,
      handleApiError,
      query,
      selectedReports,
      selectedModel,
      simpleSave,
      saveCurrentState,
      setQuery,
    ]
  )

  // Start a new research flow
  const startResearch = useCallback(
    async (query: string, parentReportId?: string, nodes?: ResearchNode[]) => {
      if (!query.trim()) return

      setLoading(true)
      try {
        // Calculate position for the new nodes
        const randomOffset = {
          x: Math.floor(Math.random() * 600) - 300,
          y: Math.floor(Math.random() * 300),
        }

        const basePosition = {
          x: parentReportId
            ? nodes?.find((n) => n.id === parentReportId)?.position.x || 0
            : (nodes?.length || 0) * 200,
          y: parentReportId
            ? (nodes?.find((n) => n.id === parentReportId)?.position.y || 0) +
              400
            : 0,
        }

        const groupPosition = {
          x: Math.max(0, basePosition.x + randomOffset.x),
          y: Math.max(0, basePosition.y + randomOffset.y),
        }

        // Create group and search nodes
        const groupNode = createNode('group', groupPosition, { query })

        const searchNode = createNode(
          'searchNode',
          { x: 100, y: 80 },
          {
            query,
            loading: true,
            childIds: [],
            onFileUpload: (file: File) =>
              handleFileUpload(file, searchNode.id, groupNode.id),
          },
          groupNode.id
        )

        setNodes((nds) => [...nds, groupNode, searchNode])

        // Perform search API call
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            timeFilter: 'all',
            platformModel: selectedModel,
          }),
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Search failed' }))
          throw new Error(
            errorData.error || `Search failed: ${response.status}`
          )
        }

        const data = await response.json()

        if (!data.webPages?.value?.length) {
          throw new Error('No search results found')
        }

        // Transform search results
        const searchResults = data.webPages.value.map((result: any) => ({
          id: result.id || `result-${Date.now()}-${Math.random()}`,
          url: result.url,
          name: result.name || result.title,
          snippet: result.snippet,
          isCustomUrl: false,
        }))

        // Create selection node with results
        const selectionNode = createNode(
          'selectionNode',
          { x: 100, y: 200 },
          {
            results: searchResults,
            onGenerateReport: (selected, prompt) => {
              return handleGenerateReport(
                selected,
                searchNode.id,
                groupNode.id,
                prompt
              )
            },
            childIds: [],
          },
          groupNode.id
        )

        // Update nodes and create edge
        setNodes((nds) => {
          const updatedNodes = nds.map((node) =>
            node.id === searchNode.id
              ? { ...node, data: { ...node.data, loading: false } }
              : node
          )
          return [...updatedNodes, selectionNode]
        })

        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${searchNode.id}-${selectionNode.id}`,
            source: searchNode.id,
            target: selectionNode.id,
            animated: true,
          },
        ])
      } catch (error) {
        const errorMsg = handleApiError(error, 'Search')

        setNodes((nds) =>
          nds.map((node) =>
            node.data.loading
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    loading: false,
                    error: errorMsg,
                  },
                }
              : node
          )
        )
      } finally {
        setLoading(false)
      }
    },
    [
      createNode,
      selectedModel,
      setEdges,
      setNodes,
      handleApiError,
      handleFileUpload,
      handleGenerateReport,
    ]
  )

  return {
    loading,
    startResearch,
    handleGenerateReport,
    handleFileUpload,
  }
}

// Custom hook for handling consolidation of reports
function useConsolidation(
  createNode: (
    type: string,
    position: XYPosition,
    data: Partial<FlowNodeData>,
    parentId?: string
  ) => ResearchNode,
  nodes: ResearchNode[],
  setNodes: React.Dispatch<React.SetStateAction<ResearchNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  selectedModel: string
) {
  const [isConsolidating, setIsConsolidating] = useState(false)

  const consolidateReports = useCallback(
    async (selectedReports: string[]) => {
      if (selectedReports.length < 2) {
        return {
          success: false,
          error: 'Select at least 2 reports to consolidate',
        }
      }

      setIsConsolidating(true)
      try {
        const reportsToConsolidate = nodes
          .filter(
            (node) => selectedReports.includes(node.id) && node.data.report
          )
          .map((node) => node.data.report!)

        if (reportsToConsolidate.length < 2) {
          throw new Error('Need at least 2 valid reports to consolidate')
        }

        const response = await fetch('/api/consolidate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reports: reportsToConsolidate,
            platformModel: selectedModel,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate consolidated report')
        }

        const consolidated: Report = await response.json()

        // Calculate position for consolidated node group
        const groupNode = createNode(
          'group',
          {
            x:
              Math.max(
                ...selectedReports.map(
                  (id) => nodes.find((n) => n.id === id)?.position.x || 0
                )
              ) + 1000,
            y: Math.min(
              ...selectedReports.map(
                (id) => nodes.find((n) => n.id === id)?.position.y || 0
              )
            ),
          },
          { query: 'Consolidated Research' }
        )

        // Create consolidated report node
        const consolidatedNode = createNode(
          'reportNode',
          { x: 100, y: 100 },
          {
            report: consolidated,
            loading: false,
            childIds: [],
            hasChildren: false,
            isConsolidated: true,
          },
          groupNode.id
        )

        // Update nodes and create edges
        setNodes((nds) => {
          const updatedNodes = nds.map((node) =>
            selectedReports.includes(node.id)
              ? { ...node, data: { ...node.data, isSelected: false } }
              : node
          )
          return [...updatedNodes, groupNode, consolidatedNode]
        })

        setEdges((eds) => [
          ...eds,
          ...selectedReports.map((reportId) => ({
            id: `edge-${reportId}-${consolidatedNode.id}`,
            source: reportId,
            target: consolidatedNode.id,
            animated: true,
            type: 'consolidated',
          })),
        ])

        return { success: true, consolidated }
      } catch (error) {
        console.error('Consolidation error:', error)
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to consolidate reports',
        }
      } finally {
        setIsConsolidating(false)
      }
    },
    [createNode, nodes, selectedModel, setEdges, setNodes]
  )

  return {
    isConsolidating,
    consolidateReports,
  }
}

// Function to wrap the Flow component with ReactFlowProvider to enable useReactFlow
function Flow() {
  const [nodes, setNodes] = useState<ResearchNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [query, setQuery] = useState('')
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  // Only initialize ONCE - track if we've done first initialization
  const hasInitialized = useRef(false)

  const { toast } = useToast()

  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateCurrentProject,
    deleteProject,
    saveCurrentState,
    exportProjects,
    importProjects,
    storageInfo,
    refreshStorageInfo,
    simpleSave,
  } = useFlowProjects()

  // Get ReactFlow instance to access viewport
  const reactFlowInstance = useReactFlow()

  // Create stable references for the save functions
  const saveViewportRef = useRef<(() => void) | null>(null)
  const saveNodesRef = useRef<(() => void) | null>(null)
  const saveEdgesRef = useRef<(() => void) | null>(null)

  // Update the function references when dependencies change
  useEffect(() => {
    // Create the save functions only when the project or update function changes
    if (!currentProject) return

    // Use function that captures the current values but doesn't create
    // a dependency on them, to avoid recreating functions on every node/edge change
    saveViewportRef.current = createDebouncedViewportSave(
      () => reactFlowInstance.getViewport(),
      currentProject,
      updateCurrentProject
    )

    saveNodesRef.current = createDebouncedNodesSave(
      // Capture latest nodes via callback
      () => nodes,
      currentProject,
      updateCurrentProject
    )

    saveEdgesRef.current = createDebouncedEdgesSave(
      // Capture latest edges via callback
      () => edges,
      currentProject,
      updateCurrentProject
    )

    // Cleanup when project changes
    return () => {
      saveViewportRef.current = null
      saveNodesRef.current = null
      saveEdgesRef.current = null
    }
  }, [currentProject, reactFlowInstance, updateCurrentProject])

  // Stable callback wrappers that use the refs
  const saveViewport = useCallback(() => {
    if (saveViewportRef.current && currentProject && hasInitialized.current) {
      saveViewportRef.current()
    }
  }, [currentProject])

  const saveNodes = useCallback(() => {
    if (saveNodesRef.current && currentProject && hasInitialized.current) {
      saveNodesRef.current()
    }
  }, [currentProject])

  const saveEdges = useCallback(() => {
    if (saveEdgesRef.current && currentProject && hasInitialized.current) {
      saveEdgesRef.current()
    }
  }, [currentProject])

  // Node changes handler with stable callback
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes)
      setNodes(updatedNodes)

      // Skip if no current project or during initialization
      if (!currentProject || !hasInitialized.current) return

      // Use our debounced save function
      saveNodes()
    },
    [nodes, currentProject, saveNodes]
  )

  // Edge changes handler
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges)
      setEdges(updatedEdges)

      // Skip if no current project or during initialization
      if (!currentProject || !hasInitialized.current) return

      // Use our debounced save function
      saveEdges()
    },
    [edges, currentProject, saveEdges]
  )

  // Connection handler
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges)
      setEdges(newEdges)

      // Skip if no current project or during initialization
      if (!currentProject || !hasInitialized.current) return

      // Immediately save connections (less frequent operation)
      updateCurrentProject({ edges: newEdges })
    },
    [edges, currentProject, updateCurrentProject]
  )

  // Viewport change handler
  const onMoveEnd = useCallback(() => {
    if (currentProject && hasInitialized.current) {
      saveViewport()
    }
  }, [currentProject, saveViewport])

  // Load data from the current project - using a ref to prevent repeated execution
  const currentProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    // If the project is null or ID hasn't changed, skip the effect
    if (!currentProject || currentProjectIdRef.current === currentProject.id) {
      return
    }

    console.log(`Loading project: ${currentProject.name}`)
    hasInitialized.current = false
    currentProjectIdRef.current = currentProject.id

    // Set the nodes and edges from the project
    setNodes(currentProject.nodes || [])
    setEdges(currentProject.edges || [])
    setQuery(currentProject.query || '')
    setSelectedReports(currentProject.selectedReports || [])

    // Restore the viewport for this project using our utility
    let viewportTimer: NodeJS.Timeout | null = null
    if (currentProject.viewport && reactFlowInstance) {
      try {
        // Use a slight delay to ensure the nodes have been rendered
        viewportTimer = setTimeout(() => {
          if (reactFlowInstance && currentProject.viewport) {
            reactFlowInstance.setViewport(currentProject.viewport!)
          }
        }, 100)
      } catch (error) {
        console.error('Failed to restore project viewport:', error)
      }
    }

    // Mark as initialized after a short delay
    const initTimer = setTimeout(() => {
      hasInitialized.current = true
      console.log(`Project ${currentProject.name} fully initialized`)
    }, 200)

    // Cleanup the timers if component unmounts
    return () => {
      if (viewportTimer) clearTimeout(viewportTimer)
      clearTimeout(initTimer)
    }
  }, [currentProject, reactFlowInstance])

  // Detect when we're dealing with a fresh project with no nodes
  const hasDetectedNewFlowRef = useRef<boolean>(false)

  useEffect(() => {
    if (
      currentProject &&
      currentProject.nodes.length === 0 &&
      nodes.length > 0 &&
      hasInitialized.current &&
      !hasDetectedNewFlowRef.current
    ) {
      // This is a new flow with nodes but the current project doesn't have them yet
      console.log('Detected new flow - saving initial state')
      hasDetectedNewFlowRef.current = true

      // Save the current state to the project
      updateCurrentProject({
        nodes,
        edges,
        query,
        selectedReports,
        viewport: reactFlowInstance.getViewport(),
      })
    }

    // Reset the detection flag when the project changes
    if (!currentProject || currentProject.nodes.length > 0) {
      hasDetectedNewFlowRef.current = false
    }
  }, [
    currentProject,
    nodes,
    edges,
    query,
    selectedReports,
    reactFlowInstance,
    updateCurrentProject,
  ])

  // ULTRA-SIMPLE Report selection handler - directly updates both state and nodes in one go
  const handleReportSelect = useCallback(
    (reportId: string) => {
      setSelectedReports((currentSelectedReports) => {
        const isCurrentlySelected = currentSelectedReports.includes(reportId)
        const newSelectedReports = isCurrentlySelected
          ? currentSelectedReports.filter((id) => id !== reportId)
          : [...currentSelectedReports, reportId]

        // Update the nodes to reflect the selection state
        setNodes((nds) =>
          nds.map((node) =>
            node.id === reportId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    isSelected: !isCurrentlySelected,
                  },
                }
              : node
          )
        )

        return newSelectedReports
      })
    },
    [setNodes]
  )

  // Node creation utility - centralized logic for creating nodes
  const createNode = useCallback(
    (
      type: string,
      position: XYPosition,
      data: Partial<FlowNodeData>,
      parentId?: string
    ): ResearchNode => {
      const id =
        data.id ||
        `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const config = NODE_CONFIG[type as keyof typeof NODE_CONFIG] || {
        zIndex: 1,
      }

      // Base node data with selection state for report nodes
      const nodeData = {
        ...data,
        id,
        childIds: data.childIds || [],
        ...(type === 'reportNode' && {
          isSelected: selectedReports.includes(id),
          onSelect: handleReportSelect,
        }),
      }

      // Create node with appropriate configuration
      const node: ResearchNode = {
        id,
        type,
        position: {
          x: Math.max(0, Math.round(position.x)),
          y: Math.max(0, Math.round(position.y)),
        },
        data: nodeData as FlowNodeData,
        parentId,
        extent: 'parent',
        zIndex: config.zIndex,
        ...(type === 'group' && { style: config.style }),
      }

      return node
    },
    [selectedReports, handleReportSelect]
  )

  // Use the research flow hook
  const {
    loading: researchLoading,
    startResearch,
    handleGenerateReport,
    handleFileUpload,
  } = useResearchFlow(
    createNode,
    setNodes,
    setEdges,
    selectedModel,
    edges,
    query,
    selectedReports,
    saveCurrentState,
    setQuery,
    simpleSave
  )

  // Use the consolidation hook
  const { isConsolidating, consolidateReports } = useConsolidation(
    createNode,
    nodes,
    setNodes,
    setEdges,
    selectedModel
  )

  // Update nodes when selectedReports changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'reportNode') {
          return {
            ...node,
            data: {
              ...node.data,
              isSelected: selectedReports.includes(node.id),
            },
          }
        }
        return node
      })
    )
  }, [selectedReports, setNodes])

  // IMPROVED auto-save with debounce - prevent multiple saves of the same data
  const previousSaveRef = useRef<string>('')

  useEffect(() => {
    // Only save if we've completed initialization
    if (!hasInitialized.current) return

    const saveTimer = setTimeout(() => {
      // Create a signature of what we're about to save
      const saveSignature = JSON.stringify({
        nodeCount: nodes.length,
        edgeCount: edges.length,
        query,
        selectedReports,
      })

      // Only save if the signature has changed
      if (saveSignature !== previousSaveRef.current) {
        previousSaveRef.current = saveSignature
        saveCurrentState(nodes, edges, query, selectedReports)
      } else {
      }
    }, 1000)

    return () => clearTimeout(saveTimer)
  }, [nodes, edges, query, selectedReports, saveCurrentState])

  // REDESIGNED project initialization - only runs ONCE
  useEffect(() => {
    // Don't run if we've already initialized
    if (hasInitialized.current) return

    if (currentProject) {
      // Set basic state
      setQuery(currentProject.query)

      // Get the selectedReports from the project (only if we don't have any)
      const projectSelections = currentProject.selectedReports || []
      if (selectedReports.length === 0 && projectSelections.length > 0) {
        setSelectedReports(projectSelections)
      }

      // Map the nodes with the proper callbacks
      const nodesWithCallbacks = (currentProject.nodes as ResearchNode[]).map(
        (node) => {
          // Clear any error states when loading from localStorage
          const nodeData = {
            ...node.data,
            id: node.id,
            error: undefined, // Clear any error state
            loading: false, // Reset loading state
          }

          if (node.type === 'reportNode') {
            // Set isSelected based on the selectedReports we just set
            const isNodeSelected = projectSelections.includes(node.id)

            return {
              ...node,
              data: {
                ...nodeData,
                isSelected: isNodeSelected,
                onSelect: (id: string) => handleReportSelect(id),
              },
            }
          }
          if (node.type === 'selectionNode') {
            return {
              ...node,
              data: {
                ...nodeData,
                onGenerateReport: (
                  selectedResults: SearchResult[],
                  prompt: string
                ) => {
                  const parentGroupId = node.parentId
                  // Find the search node in the same group
                  const searchNode = currentProject.nodes.find(
                    (n) =>
                      n.type === 'searchNode' && n.parentId === parentGroupId
                  )
                  const searchNodeId = searchNode?.id || ''

                  if (!searchNodeId || !parentGroupId) {
                    console.error(
                      'Unable to find associated search node or group for selection node',
                      node.id
                    )
                    toast({
                      title: 'Error',
                      description:
                        "Couldn't find the search node associated with these results. Try refreshing the page.",
                      variant: 'destructive',
                    })
                    return
                  }

                  return handleGenerateReport(
                    selectedResults,
                    searchNodeId,
                    parentGroupId,
                    prompt
                  )
                },
              },
            }
          }
          if (node.type === 'searchNode') {
            return {
              ...node,
              data: {
                ...nodeData,
                onFileUpload: node.parentId
                  ? (file: File) =>
                      handleFileUpload(file, node.id, node.parentId || '')
                  : undefined,
              },
            }
          }
          if (node.type === 'questionNode') {
            return {
              ...node,
              data: {
                ...nodeData,
                onApprove: (term?: string) => {
                  if (term) {
                    setQuery(term)
                    toast({
                      title: 'Search query updated',
                      description: `Updated search query to: "${term}"`,
                    })
                  }
                  return term
                },
              },
            }
          }
          return {
            ...node,
            data: nodeData,
          }
        }
      )

      setNodes(nodesWithCallbacks as ResearchNode[])
      setEdges(currentProject.edges)

      // Mark that we've initialized - NEVER run this effect again
      hasInitialized.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject, handleReportSelect]) // Only these deps, but use hasInitialized to prevent re-runs

  // Start research handler
  const handleStartResearch = useCallback(
    async (parentReportId?: string) => {
      if (!query.trim()) return
      await startResearch(query, parentReportId, nodes)
    },
    [query, nodes, startResearch]
  )

  // Consolidation handler - add extra logging
  const handleConsolidateSelected = useCallback(async () => {
    if (selectedReports.length < 2) {
      console.error('Select at least 2 reports to consolidate')
      return
    }

    const result = await consolidateReports(selectedReports)
    if (result.success) {
      setSelectedReports([])
    } else if (result.error) {
      toast({
        title: 'Consolidation Failed',
        description: String(result.error),
        variant: 'destructive',
      })
    }
  }, [consolidateReports, selectedReports, toast])

  // Project management functions
  const handleCreateNewProject = useCallback(
    (name: string) => {
      createProject(name)
      setNodes([])
      setEdges([])
      setQuery('')
      setSelectedReports([])
    },
    [createProject]
  )

  const handleRenameProject = useCallback(
    (id: string, name: string) => {
      if (currentProject?.id === id) {
        updateCurrentProject({ name })
      }
    },
    [currentProject, updateCurrentProject]
  )

  // UI Components
  const renderNavigation = () => (
    <nav className='border-b bg-white shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo and main navigation */}
          <div className='flex items-center'>
            <div className='flex-shrink-0 flex items-center'>
              <Link href='/' className='font-bold text-xl text-primary'>
                <img
                  src='/apple-icon.png'
                  alt='Open Deep Research'
                  className='h-8 w-8 rounded-full'
                />
              </Link>
            </div>
            <div className='hidden sm:ml-6 sm:flex sm:space-x-4'>
              <Button asChild variant='ghost' size='sm'>
                <Link href='/'>Home</Link>
              </Button>
              <Button asChild variant='ghost' size='sm'>
                <Link
                  href='https://www.loom.com/share/3c4d9811ac1d47eeaa7a0907c43aef7f'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Project controls */}
          <div className='flex items-center gap-2'>
            <ProjectSelector
              projects={projects}
              currentProject={currentProject}
              onSelectProject={setCurrentProject}
              onCreateProject={handleCreateNewProject}
              onDeleteProject={deleteProject}
              onRenameProject={handleRenameProject}
            />
            <ProjectActions
              exportProjects={exportProjects}
              importProjects={importProjects}
              storageInfo={storageInfo}
              refreshStorageInfo={refreshStorageInfo}
            />

            {/* Mobile menu */}
            <div className='sm:hidden flex items-center'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-8 w-8'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='w-5 h-5'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem asChild>
                    <Link href='/'>Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href='https://www.loom.com/share/3c4d9811ac1d47eeaa7a0907c43aef7f'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      Watch Demo
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )

  const renderControls = () => (
    <div className='p-4 bg-gray-50'>
      <div className='max-w-4xl mx-auto flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Enter research topic'
            className='flex-1 min-w-0'
          />
          <Button
            onClick={() => handleStartResearch()}
            disabled={researchLoading}
            className='gap-2 whitespace-nowrap'
          >
            {researchLoading ? (
              <>
                <Brain className='h-4 w-4 animate-spin' />
                Researching...
              </>
            ) : (
              <>
                <Search className='h-4 w-4' />
                Start Research
              </>
            )}
          </Button>
        </div>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto'>
            <p className='text-sm text-gray-500 whitespace-nowrap'>
              Model for report generation:
            </p>
            <ModelSelect
              value={selectedModel}
              onValueChange={setSelectedModel}
              triggerClassName='w-full sm:w-[200px]'
            />
          </div>
          <Button
            onClick={handleConsolidateSelected}
            disabled={selectedReports.length < 2 || isConsolidating}
            variant='outline'
            className='gap-2 w-full sm:w-auto sm:ml-auto'
          >
            {isConsolidating ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Consolidating...
              </>
            ) : (
              <>
                <FileText className='h-4 w-4' />
                Consolidate Selected ({selectedReports.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderErrorNotification = () => {
    const errorNode = nodes.find((node) => node.data.error)
    if (!errorNode) return null

    return (
      <div className='absolute top-0 left-0 right-0 z-10 p-3 bg-red-50 border-b border-red-200'>
        <div className='max-w-4xl mx-auto flex items-center gap-2 text-red-700'>
          <AlertTriangle className='h-4 w-4' />
          <p className='text-sm'>{errorNode.data.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='h-screen flex flex-col'>
      {renderNavigation()}
      {renderControls()}
      <div className='flex-1 w-full h-0 relative overflow-hidden'>
        {renderErrorNotification()}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={
            nodes.length > 0 && !currentProject?.nodes?.length ? true : false
          }
          minZoom={0.1}
          maxZoom={1.5}
          onMoveEnd={onMoveEnd}
          className='transition-all duration-200'
        >
          <MiniMap
            nodeStrokeWidth={3}
            className='!bottom-4 !right-4 !left-auto'
            pannable
            zoomable
          />
          <Background />
          <Controls
            className='!top-4 !right-4 !left-auto !bottom-auto'
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </div>
  )
}

// Export the flow component wrapped with ReactFlowProvider
export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}
