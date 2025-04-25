import { useState, useEffect } from 'react'
import { type KnowledgeBaseReport, type Report } from '@/types'
import {
  addToKnowledgeBase,
  getKnowledgeBaseReports,
  deleteFromKnowledgeBase,
  searchKnowledgeBase,
} from '@/lib/knowledge-base'

export function useKnowledgeBase() {
  const [reports, setReports] = useState<KnowledgeBaseReport[]>([])

  useEffect(() => {
    // Load reports on mount
    setReports(getKnowledgeBaseReports())

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'knowledge_base') {
        setReports(getKnowledgeBaseReports())
      }
    }

    // Listen for custom knowledge base change events (same window)
    const handleKnowledgeBaseChange = () => {
      setReports(getKnowledgeBaseReports())
    }

    // Listen for both storage and custom events
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('knowledge_base_change', handleKnowledgeBaseChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('knowledge_base_change', handleKnowledgeBaseChange)
    }
  }, [])

  const addReport = (report: Report, query: string) => {
    const newReport: KnowledgeBaseReport = {
      id: `kb-${Date.now()}`,
      timestamp: Date.now(),
      query,
      report,
    }

    const success = addToKnowledgeBase(newReport)
    if (success) {
      setReports(getKnowledgeBaseReports())
    }
    return success
  }

  const deleteReport = (reportId: string) => {
    const success = deleteFromKnowledgeBase(reportId)
    if (success) {
      setReports(getKnowledgeBaseReports())
    }
    return success
  }

  const searchReports = (query: string) => {
    return searchKnowledgeBase(query)
  }

  const clearAllReports = () => {
    localStorage.removeItem('knowledge_base')
    setReports([])
    return true
  }

  return {
    reports,
    addReport,
    deleteReport,
    searchReports,
    clearAllReports,
  }
} 