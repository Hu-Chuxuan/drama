import { useState } from 'react'
import { PlusCircle, FolderOpen, Trash2, Edit, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import type { FlowProject } from '@/hooks/use-flow-projects'

interface ProjectSelectorProps {
  projects: FlowProject[]
  currentProject: FlowProject | null
  onSelectProject: (project: FlowProject) => void
  onCreateProject: (name: string) => void
  onDeleteProject: (id: string) => void
  onRenameProject: (id: string, name: string) => void
}

export function ProjectSelector({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
}: ProjectSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<FlowProject | null>(
    null
  )
  const [editingProject, setEditingProject] = useState<FlowProject | null>(null)
  const [editName, setEditName] = useState('')
  const { toast } = useToast()

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: 'Project name required',
        description: 'Please enter a name for your project',
        variant: 'destructive',
      })
      return
    }

    onCreateProject(newProjectName)
    setNewProjectName('')
    setIsCreateDialogOpen(false)

    toast({
      title: 'Project created',
      description: `"${newProjectName}" has been created successfully.`,
    })
  }

  const handleDeleteProject = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id)
      setProjectToDelete(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: 'Project deleted',
        description: `"${projectToDelete.name}" has been deleted.`,
      })
    }
  }

  const handleSaveRename = (project: FlowProject) => {
    if (editName.trim()) {
      onRenameProject(project.id, editName)

      toast({
        title: 'Project renamed',
        description: `Project has been renamed to "${editName}".`,
      })
    }
    setEditingProject(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  const handleSelectProject = (project: FlowProject) => {
    if (currentProject?.id !== project.id) {
      onSelectProject(project)

      toast({
        title: 'Switching projects',
        description: `Loading "${project.name}"...`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 300)
    }
  }

  return (
    <>
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-9 text-sm font-medium gap-1.5 px-2.5'
                >
                  <FolderOpen className='h-4 w-4' />
                  <span className='max-w-[120px] truncate'>
                    {currentProject ? currentProject.name : 'Select Project'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch or manage projects</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align='end' className='w-[260px]'>
            <div className='px-2 py-1.5 text-sm font-medium text-gray-500 flex justify-between items-center'>
              <span>Your Projects</span>
              <span className='text-xs text-gray-400'>
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            </div>
            <DropdownMenuSeparator />

            <div className='max-h-[300px] overflow-y-auto py-1'>
              {projects.length === 0 ? (
                <div className='px-2 py-4 text-center text-sm text-gray-500'>
                  No projects yet. Create your first one!
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className='px-1 py-0.5'>
                    {editingProject?.id === project.id ? (
                      <div className='flex items-center gap-1 p-1'>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className='h-7 text-xs'
                          autoFocus
                        />
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6'
                          onClick={() => handleSaveRename(project)}
                        >
                          <Check className='h-3 w-3' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6'
                          onClick={() => setEditingProject(null)}
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenuItem
                        className={`flex justify-between items-center p-2 ${
                          currentProject?.id === project.id
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : ''
                        }`}
                      >
                        <div
                          className='flex-1 overflow-hidden text-ellipsis'
                          onClick={() => handleSelectProject(project)}
                        >
                          <div className='font-medium'>{project.name}</div>
                          <div className='text-xs text-gray-500'>
                            Updated {formatDate(project.updatedAt)}
                          </div>
                        </div>
                        <div className='flex gap-1 ml-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProject(project)
                              setEditName(project.name)
                            }}
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 text-red-500 hover:text-red-600'
                            onClick={(e) => {
                              e.stopPropagation()
                              setProjectToDelete(project)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </div>
                ))
              )}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='cursor-pointer text-primary focus:text-primary focus:bg-primary/10'
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              Create New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new research project
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder='Project name'
            className='mt-4'
            autoFocus
          />
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
