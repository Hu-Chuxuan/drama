import { useState, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'
import {
  getLocalStorageUsage,
  formatBytes,
  exportFlowProjects,
  importFlowProjects,
} from '@/lib/localStorage-utils'

export interface FlowProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  nodes: Node[]
  edges: Edge[]
  query: string
  selectedReports: string[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}

interface StorageInfo {
  usage: number
  usagePercent: number
  available: number
  limit: number
  formattedUsage: string
  formattedAvailable: string
}

interface UseFlowProjectsReturn {
  projects: FlowProject[]
  currentProject: FlowProject | null
  setCurrentProject: (project: FlowProject) => void
  createProject: (name: string) => FlowProject
  updateCurrentProject: (
    data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>
  ) => void
  deleteProject: (id: string) => void
  saveCurrentState: (
    nodes: Node[],
    edges: Edge[],
    query: string,
    selectedReports?: string[]
  ) => void
  exportProjects: () => string
  importProjects: (jsonData: string) => boolean
  storageInfo: StorageInfo
  refreshStorageInfo: () => void
  saveDirect: () => void
  simpleSave: (
    nodes: Node[],
    edges: Edge[],
    query: string,
    selectedReports?: string[]
  ) => void
}

const LOCAL_STORAGE_KEY = 'open-deep-research-flow-projects'
const CURRENT_PROJECT_KEY = 'open-deep-research-current-project'

export function useFlowProjects(): UseFlowProjectsReturn {
  const [projects, setProjects] = useState<FlowProject[]>([])
  const [currentProject, setCurrentProject] = useState<FlowProject | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(() => {
    const info = getLocalStorageUsage()
    return {
      ...info,
      formattedUsage: formatBytes(info.usage),
      formattedAvailable: formatBytes(info.available),
    }
  })

  // Save current state with preprocessing for loading states and debug logging
  const saveCurrentState = (
    nodes: Node[],
    edges: Edge[],
    query: string,
    selectedReports: string[] = []
  ) => {
    // Just save everything directly without any complicated processing
    if (currentProject) {
      // Get all report nodes
      const reportNodes = nodes.filter((node) => node.type === 'reportNode')

      // Update the current project
      const updatedData = {
        nodes,
        edges,
        query,
        selectedReports,
      }

      // Update React state
      updateCurrentProject(updatedData)

      // Also directly save to localStorage
      const updatedProject = {
        ...currentProject,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      }

      const updatedProjects = projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      )

      // Save directly to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects))
    } else if (
      nodes.length > 0 ||
      edges.length > 0 ||
      selectedReports.length > 0
    ) {
      // Create a default project if we have any data but no current project
      const newProject = createProject('My Research Project')
      const updatedData = {
        nodes,
        edges,
        query,
        selectedReports,
      }

      updateCurrentProject(updatedData)

      // Also directly save to localStorage
      const updatedProject = {
        ...newProject,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      }

      const updatedProjects = [...projects, updatedProject]

      // Save directly to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects))
      console.log('Created new project and saved directly to localStorage')
    }
  }

  // Helper function to postprocess nodes after loading to ensure proper state
  const postprocessLoadedNodes = (nodes: Node[]): Node[] => {
    return nodes.map((node) => {
      // Create a deep copy to avoid mutating the original
      const nodeCopy = JSON.parse(JSON.stringify(node))

      // Set appropriate loading states for report and question nodes
      if (nodeCopy.type === 'reportNode') {
        // In our application, the report data is stored in data.report object
        if (nodeCopy.data?.report) {
          // We have a report object
          nodeCopy.data.loading = false
        } else {
          // No report data exists
          nodeCopy.data.loading = false
          nodeCopy.data.report = {
            title: 'Report Unavailable',
            summary:
              'The report content is not available. Please regenerate the report.',
            sections: [],
          }
        }
      }

      if (nodeCopy.type === 'questionNode') {
        // For question nodes, we look for searchTerms, not questions
        if (
          nodeCopy.data?.searchTerms &&
          Array.isArray(nodeCopy.data.searchTerms)
        ) {
          nodeCopy.data.loading = false
        } else {
          nodeCopy.data.loading = false
          nodeCopy.data.searchTerms = []
        }
      }

      return nodeCopy
    })
  }

  // Load projects from localStorage with post-processing
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(LOCAL_STORAGE_KEY)
      const savedCurrentProjectId = localStorage.getItem(CURRENT_PROJECT_KEY)

      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects) as FlowProject[]

        // Process all projects
        const normalizedProjects = parsedProjects.map((project) => ({
          ...project,
          selectedReports: project.selectedReports || [],
          // Ensure nodes don't have invalid loading states
          nodes: postprocessLoadedNodes(project.nodes || []),
        }))

        setProjects(normalizedProjects)

        if (savedCurrentProjectId) {
          const current = normalizedProjects.find(
            (p) => p.id === savedCurrentProjectId
          )
          if (current) {
            setCurrentProject(current)
          }
        } else if (normalizedProjects.length > 0) {
          // Default to the most recently updated project
          const mostRecent = [...normalizedProjects].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0]
          setCurrentProject(mostRecent)
          localStorage.setItem(CURRENT_PROJECT_KEY, mostRecent.id)
        }
      } else {
        // Create a default project if no projects exist
        const defaultProject = createProject('My Research Project')
        setProjects([defaultProject])
        setCurrentProject(defaultProject)
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify([defaultProject])
        )
        localStorage.setItem(CURRENT_PROJECT_KEY, defaultProject.id)
      }

      refreshStorageInfo()
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error)
    }
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects))
      refreshStorageInfo()
    }
  }, [projects])

  // Save current project ID whenever it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProject.id)
    }
  }, [currentProject])

  const refreshStorageInfo = () => {
    const info = getLocalStorageUsage()
    setStorageInfo({
      ...info,
      formattedUsage: formatBytes(info.usage),
      formattedAvailable: formatBytes(info.available),
    })
  }

  const createProject = (name: string): FlowProject => {
    const now = new Date().toISOString()
    const newProject: FlowProject = {
      id: `project-${Date.now()}`,
      name,
      createdAt: now,
      updatedAt: now,
      nodes: [],
      edges: [],
      query: '',
      selectedReports: [],
    }

    setProjects((prev) => [...prev, newProject])
    setCurrentProject(newProject)
    refreshStorageInfo()
    return newProject
  }

  const updateCurrentProject = (
    data: Partial<Omit<FlowProject, 'id' | 'createdAt'>>
  ) => {
    if (!currentProject) return

    const updatedProject = {
      ...currentProject,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    setCurrentProject(updatedProject)
    setProjects((prev) =>
      prev.map((p) => (p.id === currentProject.id ? updatedProject : p))
    )
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))

    if (currentProject?.id === id) {
      const remainingProjects = projects.filter((p) => p.id !== id)
      if (remainingProjects.length > 0) {
        setCurrentProject(remainingProjects[0])
      } else {
        // Reinitialize the project
        const defaultProject = createProject('My Research Project')
        setProjects([defaultProject])
        setCurrentProject(defaultProject)
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify([defaultProject])
        )
        localStorage.setItem(CURRENT_PROJECT_KEY, defaultProject.id)
      }
    }

    refreshStorageInfo()
    window.location.reload() // Force reload the page after deletion
  }

  const exportProjects = (): string => {
    return exportFlowProjects()
  }

  const importProjectsData = (jsonData: string): boolean => {
    const success = importFlowProjects(jsonData)
    if (success) {
      // Reload projects from localStorage after import
      try {
        const savedProjects = localStorage.getItem(LOCAL_STORAGE_KEY)
        const savedCurrentProjectId = localStorage.getItem(CURRENT_PROJECT_KEY)

        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects) as FlowProject[]

          // Process all imported projects
          const normalizedProjects = parsedProjects.map((project) => ({
            ...project,
            selectedReports: project.selectedReports || [],
            // Post-process nodes to handle loading states
            nodes: postprocessLoadedNodes(project.nodes || []),
          }))

          setProjects(normalizedProjects)

          if (savedCurrentProjectId) {
            const current = normalizedProjects.find(
              (p) => p.id === savedCurrentProjectId
            )
            if (current) {
              setCurrentProject(current)
            } else if (normalizedProjects.length > 0) {
              setCurrentProject(normalizedProjects[0])
            }
          } else if (normalizedProjects.length > 0) {
            setCurrentProject(normalizedProjects[0])
          }
        }

        refreshStorageInfo()
      } catch (error) {
        console.error('Failed to reload projects after import:', error)
      }
    }
    return success
  }

  // Get raw node and edge data and immediately save to localStorage
  const saveDirect = () => {
    if (!currentProject) return

    try {
      // Just directly save the current project we have in memory
      const allProjects = [...projects]
      const currentIndex = allProjects.findIndex(
        (p) => p.id === currentProject.id
      )

      if (currentIndex >= 0) {
        // Update the current project with what we have
        allProjects[currentIndex] = {
          ...allProjects[currentIndex],
          updatedAt: new Date().toISOString(),
        }

        // Save directly to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allProjects))
        console.log('Directly saved current state to localStorage!')
      }
    } catch (error) {
      console.error('Error directly saving to localStorage:', error)
    }
  }

  // A simplified method to save the current state without preprocessing
  const simpleSave = (
    nodes: Node[],
    edges: Edge[],
    query: string,
    selectedReports: string[] = []
  ) => {
    console.log('Simple save method called with nodes:', nodes)

    // First save the state to our React state
    if (currentProject) {
      const updatedData = {
        nodes,
        edges,
        query,
        selectedReports,
      }

      updateCurrentProject(updatedData)

      // Also force a direct localStorage save
      const updatedProject = {
        ...currentProject,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      }

      const updatedProjects = projects.map((p) =>
        p.id === currentProject.id ? updatedProject : p
      )

      // Save directly to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects))
      console.log('Directly saved to localStorage!')
    }
  }

  return {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateCurrentProject,
    deleteProject,
    saveCurrentState,
    exportProjects,
    importProjects: importProjectsData,
    storageInfo,
    refreshStorageInfo,
    saveDirect,
    simpleSave,
  }
}
