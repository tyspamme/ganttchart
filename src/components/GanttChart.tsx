import * as React from 'react'
import { addMonths, addQuarters, format, isWithinInterval, startOfMonth, startOfQuarter, parseISO, differenceInMonths, differenceInQuarters, addWeeks, startOfWeek, differenceInWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Search, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'

interface Task {
  id: string
  title: string
  startDate: Date
  endDate: Date
  progress: number
  subtasks?: Task[]
  parentId?: string
  assignee?: string
  status: 'Not Started' | 'In Progress' | 'Completed'
  dependencies?: string[]
  isExpanded?: boolean
  overridePercentage?: boolean
  overrideDuration?: boolean
}

export default function GanttChart() {
  const [tasks, setTasks] = React.useState<Task[]>([
    {
      id: '1',
      title: 'UX - Desktop',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-09'),
      progress: 0,
      status: 'Not Started',
      isExpanded: true,
      overridePercentage: false,
      overrideDuration: false,
      subtasks: [
        {
          id: '1-1',
          title: 'Identity Management',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-04-26'),
          progress: 30,
          parentId: '1',
          status: 'In Progress',
          assignee: 'Alice',
          overridePercentage: false,
          overrideDuration: false,
        },
        {
          id: '1-2',
          title: 'Doors',
          startDate: new Date('2024-04-15'),
          endDate: new Date('2024-04-26'),
          progress: 20,
          parentId: '1',
          status: 'Not Started',
          assignee: 'Bob',
          dependencies: ['1-1'],
          overridePercentage: false,
          overrideDuration: false,
        },
      ],
    },
  ])

  const [startDate, setStartDate] = React.useState(new Date('2024-04-01'))
  const [granularity, setGranularity] = React.useState<'week' | 'month' | 'quarter'>('month')
  const [periodsToShow] = React.useState(12)
  const [isAddingTask, setIsAddingTask] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')

  const periods = React.useMemo(() => {
    const addPeriod = granularity === 'week' ? addWeeks : granularity === 'month' ? addMonths : addQuarters
    return Array.from({ length: periodsToShow }, (_, i) => addPeriod(startDate, i))
  }, [startDate, periodsToShow, granularity])

  const filteredTasks = React.useMemo(() => {
    const filterTask = (task: Task): Task | null => {
      if (task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return task
      }
      if (task.subtasks) {
        const filteredSubtasks = task.subtasks
          .map(filterTask)
          .filter((t): t is Task => t !== null)
        if (filteredSubtasks.length > 0) {
          return { ...task, subtasks: filteredSubtasks }
        }
      }
      return null
    }
    return tasks.map(filterTask).filter((t): t is Task => t !== null)
  }, [tasks, searchTerm])

  const updateTaskProgress = React.useCallback((taskId: string, newProgress: number) => {
    setTasks(prevTasks => {
      const updateTask = (task: Task): Task => {
        if (task.id === taskId) {
          return { ...task, progress: newProgress }
        }
        if (task.subtasks && task.subtasks.length > 0) {
          const updatedSubtasks = task.subtasks.map(updateTask)
          const avgProgress = task.overridePercentage
            ? task.progress
            : Math.round(updatedSubtasks.reduce((sum, t) => sum + t.progress, 0) / updatedSubtasks.length)
          return { ...task, subtasks: updatedSubtasks, progress: avgProgress }
        }
        return task
      }
      return prevTasks.map(updateTask)
    })
  }, [])

  const adjustParentTaskDuration = React.useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updateTask = (task: Task): Task => {
        if (task.id === taskId && task.subtasks && task.subtasks.length > 0 && !task.overrideDuration) {
          const minStart = new Date(Math.min(...task.subtasks.map(st => st.startDate.getTime())))
          const maxEnd = new Date(Math.max(...task.subtasks.map(st => st.endDate.getTime())))
          return { ...task, startDate: minStart, endDate: maxEnd }
        }
        if (task.subtasks) {
          return { ...task, subtasks: task.subtasks.map(updateTask) }
        }
        return task
      }
      return prevTasks.map(updateTask)
    })
  }, [])

  const handleAddOrEditTask = (task: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev =>
        prev.map(t => {
          if (t.id === editingTask.id) {
            const updatedTask = { ...t, ...task }
            updateTaskProgress(updatedTask.id, updatedTask.progress)
            return updatedTask
          }
          if (t.subtasks) {
            return {
              ...t,
              subtasks: t.subtasks.map(st =>
                st.id === editingTask.id ? { ...st, ...task } : st
              ),
            }
          }
          return t
        })
      )
      setEditingTask(null)
    } else {
      const newTask: Task = {
        id: Math.random().toString(),
        title: task.title || '',
        startDate: parseISO(task.startDate as unknown as string),
        endDate: parseISO(task.endDate as unknown as string),
        progress: task.progress || 0,
        status: task.status || 'Not Started',
        assignee: task.assignee,
        dependencies: task.dependencies,
        isExpanded: true,
        overridePercentage: false,
        overrideDuration: false,
      }

      if (task.parentId && task.parentId !== "none") {
        setTasks(prev =>
          prev.map(t => {
            if (t.id === task.parentId) {
              const updatedSubtasks = [...(t.subtasks || []), newTask]
              const avgProgress = t.overridePercentage
                ? t.progress
                : Math.round(updatedSubtasks.reduce((sum, st) => sum + st.progress, 0) / updatedSubtasks.length)
              return {
                ...t,
                subtasks: updatedSubtasks,
                progress: avgProgress,
              }
            }
            return t
          })
        )
        adjustParentTaskDuration(task.parentId)
      } else {
        setTasks(prev => [...prev, newTask])
      }
    }

    setIsAddingTask(false)
  }

  const getTaskPosition = (task: Task) => {
    const startPeriod = granularity === 'week' ? startOfWeek(task.startDate) : granularity === 'month' ? startOfMonth(task.startDate) : startOfQuarter(task.startDate)
    const periodIndex = periods.findIndex(p => p.getTime() === startPeriod.getTime())
    const width = granularity === 'week'
      ? differenceInWeeks(task.endDate, task.startDate) + 1
      : granularity === 'month'
        ? differenceInMonths(task.endDate, task.startDate) + 1
        : differenceInQuarters(task.endDate, task.startDate) + 1
    return { periodIndex, width }
  }

  const moveTimeline = (direction: 'left' | 'right') => {
    setStartDate(prev =>
      direction === 'left'
        ? granularity === 'week' ? addWeeks(prev, -1) : granularity === 'month' ? addMonths(prev, -1) : addQuarters(prev, -1)
        : granularity === 'week' ? addWeeks(prev, 1) : granularity === 'month' ? addMonths(prev, 1) : addQuarters(prev, 1)
    )
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceIndex = parseInt(result.source.index)
    const destIndex = parseInt(result.destination.index)

    setTasks(prev => {
      const updatedTasks = Array.from(prev)
      const [reorderedTask] = updatedTasks.splice(sourceIndex, 1)
      updatedTasks.splice(destIndex, 0, reorderedTask)
      return updatedTasks
    })
  }

  const renderTaskBar = (task: Task, isSubtask: boolean = false) => {
    if (
      !isWithinInterval(new Date(task.startDate), {
        start: periods[0],
        end: periods[periods.length - 1],
      })
    ) {
      return null
    }

    const { periodIndex, width } = getTaskPosition(task)
    const left = `${(periodIndex * 100) / periodsToShow}%`
    const barWidth = `${(width * 100) / periodsToShow}%`

    return (
      <div
        className={`absolute h-6 top-2 rounded flex items-center overflow-hidden ${
          isSubtask ? 'bg-secondary/30' : 'bg-primary/30'
        }`}
        style={{
          left,
          width: barWidth,
        }}
      >
        <div
          className={`h-full ${isSubtask ? 'bg-secondary' : 'bg-primary'}`}
          style={{ width: `${task.progress}%` }}
        />
        <span className="absolute inset-0 px-2 flex items-center justify-between text-xs">
          <span className="font-medium truncate">{task.title}</span>
          <span>{task.progress}%</span>
        </span>
      </div>
    )
  }

  const renderDependencyArrows = (task: Task) => {
    if (!task.dependencies) return null

    return task.dependencies.map(depId => {
      const dependentTask = tasks.find(t => t.id === depId) || tasks.flatMap(t => t.subtasks || []).find(st => st.id === depId)
      if (!dependentTask) return null

      const startPos = getTaskPosition(dependentTask)
      const endPos = getTaskPosition(task)

      const startX = ((startPos.periodIndex + startPos.width) * 100) / periodsToShow
      const startY = 50
      const endX = (endPos.periodIndex * 100) / periodsToShow
      const endY = 50

      return (
        <svg
          key={`${task.id}-${depId}`}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
            </marker>
          </defs>
          <path
            d={`M${startX}% ${startY}% L${endX}% ${endY}%`}
            stroke="#888"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        </svg>
      )
    })
  }

  const toggleTaskExpansion = (taskId: string) => {
    setTasks(prev => {
      const updateTask = (task: Task): Task => {
        if (task.id === taskId) {
          return { ...task, isExpanded: !task.isExpanded }
        }
        if (task.subtasks) {
          return { ...task, subtasks: task.subtasks.map(updateTask) }
        }
        return task
      }
      return prev.map(updateTask)
    })
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveTimeline('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveTimeline('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {format(periods[0], granularity === 'week' ? 'MMM dd, yyyy' : granularity === 'month' ? 'MMM yyyy' : 'QQQ yyyy')} -{' '}
            {format(periods[periods.length - 1], granularity === 'week' ? 'MMM dd, yyyy' : granularity === 'month' ? 'MMM yyyy' : 'QQQ yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="granularity">Granularity:</Label>
          <Select
            value={granularity}
            onValueChange={(value: 'week' | 'month' | 'quarter') => setGranularity(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Dialog open={isAddingTask || !!editingTask} onOpenChange={open => {
          setIsAddingTask(open)
          if (!open) setEditingTask(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            </DialogHeader>
            <TaskForm
              onSubmit={handleAddOrEditTask}
              initialData={editingTask || undefined}
              tasks={tasks}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-1 border rounded-lg">
        <div className="w-1/4 border-r">
          <div className="p-2 border-b bg-muted font-medium">Tasks</div>
          <ScrollArea className="h-[calc(100%-2.5rem)]">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tasks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {filteredTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskItem
                              task={task}
                              onEdit={setEditingTask}
                              onToggleExpand={toggleTaskExpansion}
                              level={0}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>
        </div>
        <div className="flex-1">
          <div className="flex border-b bg-muted">
            {periods.map(period => (
              <div
                key={period.getTime()}
                className="flex-1 p-2 text-center border-r text-sm font-medium"
              >
                {format(period, granularity === 'week' ? 'MMM dd, yyyy' : granularity === 'month' ? 'MMM yyyy' : 'QQQ yyyy')}
              </div>
            ))}
          </div>
          <ScrollArea className="h-[calc(100%-2.5rem)]">
            <div className="relative">
              {filteredTasks.map(task => (
                <React.Fragment key={task.id}>
                  <div className="relative h-10 border-b">
                    {renderTaskBar(task)}
                    {renderDependencyArrows(task)}
                  </div>
                  {task.isExpanded && task.subtasks?.map(subtask => (
                    <div key={subtask.id} className="relative h-10 border-b">
                      {renderTaskBar(subtask, true)}
                      {renderDependencyArrows(subtask)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

interface TaskFormProps {
  onSubmit: (task: Partial<Task>) => void
  initialData?: Partial<Task>
  tasks: Task[]
}

function TaskForm({ onSubmit, initialData, tasks }: TaskFormProps) {
  const [formData, setFormData] = React.useState<Partial<Task>>(
    initialData || {
      title: '',
      startDate: '',
      endDate: '',
      progress: 0,
      status: 'Not Started',
      assignee: '',
      parentId: 'none',
      dependencies: [],
      overridePercentage: false,
      overrideDuration: false,
    }
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          value={formData.endDate ? format(new Date(formData.endDate), 'yyyy-MM-dd') : ''}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="progress">Progress</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="override-percentage"
              checked={formData.overridePercentage}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, overridePercentage: checked }))}
            />
            <Label htmlFor="override-percentage">Override Percentage</Label>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            id="progress"
            name="progress"
            min={0}
            max={100}
            step={1}
            value={[formData.progress || 0]}
            onValueChange={([value]) => setFormData(prev => ({ ...prev, progress: value }))}
            className="flex-grow"
            disabled={!formData.overridePercentage && !!formData.subtasks?.length}
          />
          <span className="w-12 text-right">{formData.progress || 0}%</span>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="override-duration">Override Duration</Label>
          <Switch
            id="override-duration"
            checked={formData.overrideDuration}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, overrideDuration: checked }))}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          value={formData.status}
          onValueChange={value => setFormData(prev => ({ ...prev, status: value as Task['status'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="assignee">Assignee</Label>
        <Input
          id="assignee"
          name="assignee"
          value={formData.assignee || ''}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="parent">Parent Task</Label>
        <Select
          name="parentId"
          value={formData.parentId || "none"}
          onValueChange={value => setFormData(prev => ({ ...prev, parentId: value === "none" ? undefined : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent</SelectItem>
            {tasks.map(task => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dependencies">Dependencies</Label>
        <Select
          name="dependencies"
          value={formData.dependencies || []}
          onValueChange={value => {
            if (value && value !== "placeholder") {
              setFormData(prev => ({ ...prev, dependencies: [...(prev.dependencies || []), value] }))
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select dependencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder" disabled>Select a dependency</SelectItem>
            {tasks.flatMap(task => [
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>,
              ...(task.subtasks?.map(subtask => (
                <SelectItem key={subtask.id} value={subtask.id}>
                  {subtask.title} (subtask)
                </SelectItem>
              )) || []),
            ])}
          </SelectContent>
        </Select>
        {formData.dependencies && formData.dependencies.length > 0 && (
          <div className="mt-2">
            <Label>Selected Dependencies:</Label>
            <div className="flex <div className="flex flex-wrap gap-2 mt-1">
              {formData.dependencies.map(depId => {
                const depTask = tasks.find(t => t.id === depId) || tasks.flatMap(t => t.subtasks || []).find(st => st.id === depId);
                return (
                  <div key={depId} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm flex items-center">
                    {depTask?.title}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        dependencies: prev.dependencies?.filter(id => id !== depId)
                      }))}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Button type="submit">{initialData ? 'Update Task' : 'Add Task'}</Button>
    </form>
  )
}

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
  onToggleExpand: (taskId: string) => void
  level: number
}

function TaskItem({ task, onEdit, onToggleExpand, level }: TaskItemProps) {
  return (
    <div className="border-b hover:bg-muted/50">
      <div className="flex items-center p-2" style={{ paddingLeft: `${level * 20 + 8}px` }}>
        {task.subtasks && task.subtasks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 p-0 h-6 w-6"
            onClick={() => onToggleExpand(task.id)}
          >
            {task.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </Button>
        )}
        <span className="font-medium flex-grow">{task.title}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                Edit
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit task details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-sm text-muted-foreground px-2 pb-2" style={{ paddingLeft: `${level * 20 + 8}px` }}>
        {format(task.startDate, 'MMM d, yyyy')} - {format(task.endDate, 'MMM d, yyyy')}
      </div>
      <div className="text-sm px-2 pb-2" style={{ paddingLeft: `${level * 20 + 8}px` }}>
        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
          task.status === 'Completed' ? 'bg-green-200 text-green-800' :
          task.status === 'In Progress' ? 'bg-yellow-200 text-yellow-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {task.status}
        </span>
        {task.assignee && <span className="ml-2">Assigned to: {task.assignee}</span>}
      </div>
      {task.isExpanded && task.subtasks && (
        <div className="ml-4">
          {task.subtasks.map(subtask => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onEdit={onEdit}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}