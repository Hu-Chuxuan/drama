import { useState, useRef } from 'react'
import { Download, Upload, Info, Database, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'

interface ProjectActionsProps {
  exportProjects: () => string
  importProjects: (jsonData: string) => boolean
  storageInfo: {
    usage: number
    usagePercent: number
    available: number
    limit: number
    formattedUsage: string
    formattedAvailable: string
  }
  refreshStorageInfo: () => void
}

export function ProjectActions({
  exportProjects,
  importProjects,
  storageInfo,
  refreshStorageInfo,
}: ProjectActionsProps) {
  const [isStorageInfoOpen, setIsStorageInfoOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExport = () => {
    try {
      const jsonData = exportProjects()
      if (jsonData === '[]') {
        toast({
          title: 'No projects to export',
          description: "You don't have any projects saved to export.",
          variant: 'destructive',
        })
        return
      }

      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `open-deep-research-projects-${
        new Date().toISOString().split('T')[0]
      }.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Projects exported',
        description: 'Your projects have been exported successfully.',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your projects.',
        variant: 'destructive',
      })
    }
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string
        const success = importProjects(jsonData)

        if (success) {
          toast({
            title: 'Projects imported',
            description: 'Your projects have been imported successfully.',
          })
          refreshStorageInfo()
        } else {
          toast({
            title: 'Import failed',
            description: 'The file format is invalid or corrupted.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Import error:', error)
        toast({
          title: 'Import failed',
          description: 'There was an error importing your projects.',
          variant: 'destructive',
        })
      }
    }

    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStorageStatusColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500'
    if (percent < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        accept='.json'
        className='hidden'
      />

      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='h-9 w-9'>
                  <Database className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Project Data & Storage</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align='end' className='w-56'>
            <div className='px-2 py-1.5 text-sm font-medium text-gray-500'>
              Storage & Backup
            </div>
            <DropdownMenuSeparator />

            <div className='px-3 py-2'>
              <div className='text-xs text-gray-500 mb-1 flex justify-between'>
                <span>Storage Usage</span>
                <span>{storageInfo.formattedUsage} / 5 MB</span>
              </div>
              <div className='w-full h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getStorageStatusColor(
                    storageInfo.usagePercent
                  )}`}
                  style={{
                    width: `${Math.min(100, storageInfo.usagePercent)}%`,
                  }}
                />
              </div>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport} className='gap-2'>
              <Download className='h-4 w-4' />
              <div>
                <div className='text-sm'>Export Projects</div>
                <div className='text-xs text-gray-500'>
                  Backup your projects as JSON
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportClick} className='gap-2'>
              <Upload className='h-4 w-4' />
              <div>
                <div className='text-sm'>Import Projects</div>
                <div className='text-xs text-gray-500'>Restore from backup</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsStorageInfoOpen(true)}
              className='gap-2'
            >
              <Info className='h-4 w-4' />
              <div className='text-sm'>Storage Details</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      <Dialog open={isStorageInfoOpen} onOpenChange={setIsStorageInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>localStorage Usage</DialogTitle>
            <DialogDescription>
              Your research projects are stored in your browser&apos;s localStorage
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 space-y-4'>
            <div>
              <div className='flex justify-between text-sm mb-1'>
                <span>Storage Usage</span>
                <span>{storageInfo.formattedUsage} / 5 MB</span>
              </div>
              <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getStorageStatusColor(
                    storageInfo.usagePercent
                  )}`}
                  style={{
                    width: `${Math.min(100, storageInfo.usagePercent)}%`,
                  }}
                />
              </div>
            </div>

            {storageInfo.usagePercent > 80 && (
              <div className='flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md'>
                <AlertTriangle className='h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5' />
                <div className='text-sm text-amber-800'>
                  <p className='font-medium'>Storage is running low</p>
                  <p>
                    Consider exporting and deleting some projects to free up
                    space.
                  </p>
                </div>
              </div>
            )}

            <div className='text-sm space-y-2'>
              <p>
                <strong>Available Space:</strong>{' '}
                {storageInfo.formattedAvailable}
              </p>
              <p>
                <strong>Note:</strong> localStorage has a limit of approximately
                5MB per domain. Data is stored only in this browser and will be
                lost if you clear browser data.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsStorageInfoOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
