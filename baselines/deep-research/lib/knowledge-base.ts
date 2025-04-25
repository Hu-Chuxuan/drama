import { type KnowledgeBaseReport } from '@/types'

const KNOWLEDGE_BASE_KEY = 'knowledge_base'

// Helper to notify about knowledge base changes
const notifyKnowledgeBaseChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('knowledge_base_change'))
  }
}

export function addToKnowledgeBase(report: KnowledgeBaseReport): boolean {
  try {
    const reports = getKnowledgeBaseReports()
    reports.push(report)
    localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(reports))
    notifyKnowledgeBaseChange()
    return true
  } catch (error) {
    console.error('Failed to add report to knowledge base:', error)
    return false
  }
}

export function getKnowledgeBaseReports(): KnowledgeBaseReport[] {
  try {
    const reportsJson = localStorage.getItem(KNOWLEDGE_BASE_KEY)
    if (!reportsJson) return []
    
    const reports = JSON.parse(reportsJson) as KnowledgeBaseReport[]
    return reports.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to get knowledge base reports:', error)
    return []
  }
}

export function deleteFromKnowledgeBase(reportId: string): boolean {
  try {
    const reports = getKnowledgeBaseReports()
    const filteredReports = reports.filter(report => report.id !== reportId)
    localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(filteredReports))
    notifyKnowledgeBaseChange()
    return true
  } catch (error) {
    console.error('Failed to delete report from knowledge base:', error)
    return false
  }
}

export function searchKnowledgeBase(query: string): KnowledgeBaseReport[] {
  try {
    const reports = getKnowledgeBaseReports()
    
    // Simple search implementation - can be enhanced with better search logic
    const searchTerms = query.toLowerCase().split(' ')
    return reports.filter(report => {
      const searchText = `${report.query} ${report.report.title} ${report.report.summary}`.toLowerCase()
      return searchTerms.every(term => searchText.includes(term))
    })
  } catch (error) {
    console.error('Failed to search knowledge base:', error)
    return []
  }
} 