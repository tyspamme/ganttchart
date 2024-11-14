import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { addMonths, addQuarters, addWeeks, startOfMonth, startOfQuarter, startOfWeek } from 'date-fns';
import { Task, TimelineGranularity } from '@/types/task';

interface GanttState {
  tasks: Task[];
  startDate: Date;
  granularity: TimelineGranularity;
  periodsToShow: number;
  searchTerm: string;
  selectedTaskId: string | null;
  isAddingTask: boolean;
  editingTaskId: string | null;
  showCompleted: boolean;
  filterByAssignee: string | null;
  filterByPriority: Task['priority'] | null;
  filterByTags: string[];
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newIndex: number) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  adjustParentTaskDuration: (taskId: string) => void;
  toggleTaskExpansion: (taskId: string) => void;
  setStartDate: (date: Date) => void;
  setGranularity: (granularity: TimelineGranularity) => void;
  setSearchTerm: (term: string) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  setIsAddingTask: (isAdding: boolean) => void;
  setEditingTaskId: (taskId: string | null) => void;
  setShowCompleted: (show: boolean) => void;
  setFilterByAssignee: (assignee: string | null) => void;
  setFilterByPriority: (priority: Task['priority'] | null) => void;
  setFilterByTags: (tags: string[]) => void;
  
  // Computed values
  getFilteredTasks: () => Task[];
  getPeriods: () => Date[];
  getTaskPosition: (task: Task) => { periodIndex: number; width: number };
}

const useGanttStore = create<GanttState>()(
  devtools(
    persist(
      (set, get) => ({
        tasks: [],
        startDate: new Date(),
        granularity: 'month' as TimelineGranularity,
        periodsToShow: 12,
        searchTerm: '',
        selectedTaskId: null,
        isAddingTask: false,
        editingTaskId: null,
        showCompleted: true,
        filterByAssignee: null,
        filterByPriority: null,
        filterByTags: [],

        setTasks: (tasks) => set({ tasks }),
        
        addTask: (task) => set((state) => ({
          tasks: [...state.tasks, task]
        })),
        
        updateTask: (taskId, updates) => set((state) => ({
          tasks: state.tasks.map((task) => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        })),
        
        deleteTask: (taskId) => set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId)
        })),
        
        moveTask: (taskId, newIndex) => set((state) => {
          const tasks = [...state.tasks];
          const taskIndex = tasks.findIndex((t) => t.id === taskId);
          const [task] = tasks.splice(taskIndex, 1);
          tasks.splice(newIndex, 0, task);
          return { tasks };
        }),
        
        updateTaskProgress: (taskId, progress) => {
          const updateTask = (tasks: Task[]): Task[] => {
            return tasks.map((task) => {
              if (task.id === taskId) {
                return { ...task, progress };
              }
              if (task.subtasks) {
                const updatedSubtasks = updateTask(task.subtasks);
                const avgProgress = task.overridePercentage
                  ? task.progress
                  : Math.round(
                      updatedSubtasks.reduce((sum, t) => sum + t.progress, 0) /
                        updatedSubtasks.length
                    );
                return { ...task, subtasks: updatedSubtasks, progress: avgProgress };
              }
              return task;
            });
          };
          
          set((state) => ({
            tasks: updateTask(state.tasks)
          }));
        },
        
        adjustParentTaskDuration: (taskId) => {
          const updateTask = (tasks: Task[]): Task[] => {
            return tasks.map((task) => {
              if (task.id === taskId && task.subtasks && task.subtasks.length > 0 && !task.overrideDuration) {
                const minStart = new Date(Math.min(...task.subtasks.map((st) => st.startDate.getTime())));
                const maxEnd = new Date(Math.max(...task.subtasks.map((st) => st.endDate.getTime())));
                return { ...task, startDate: minStart, endDate: maxEnd };
              }
              if (task.subtasks) {
                return { ...task, subtasks: updateTask(task.subtasks) };
              }
              return task;
            });
          };
          
          set((state) => ({
            tasks: updateTask(state.tasks)
          }));
        },
        
        toggleTaskExpansion: (taskId) => {
          const updateTask = (tasks: Task[]): Task[] => {
            return tasks.map((task) => {
              if (task.id === taskId) {
                return { ...task, isExpanded: !task.isExpanded };
              }
              if (task.subtasks) {
                return { ...task, subtasks: updateTask(task.subtasks) };
              }
              return task;
            });
          };
          
          set((state) => ({
            tasks: updateTask(state.tasks)
          }));
        },
        
        setStartDate: (startDate) => set({ startDate }),
        setGranularity: (granularity) => set({ granularity }),
        setSearchTerm: (searchTerm) => set({ searchTerm }),
        setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
        setIsAddingTask: (isAddingTask) => set({ isAddingTask }),
        setEditingTaskId: (editingTaskId) => set({ editingTaskId }),
        setShowCompleted: (showCompleted) => set({ showCompleted }),
        setFilterByAssignee: (filterByAssignee) => set({ filterByAssignee }),
        setFilterByPriority: (filterByPriority) => set({ filterByPriority }),
        setFilterByTags: (filterByTags) => set({ filterByTags }),
        
        getFilteredTasks: () => {
          const state = get();
          const filterTask = (task: Task): Task | null => {
            const matchesSearch = task.title.toLowerCase().includes(state.searchTerm.toLowerCase());
            const matchesStatus = state.showCompleted || task.status !== 'Completed';
            const matchesAssignee = !state.filterByAssignee || task.assignee === state.filterByAssignee;
            const matchesPriority = !state.filterByPriority || task.priority === state.filterByPriority;
            const matchesTags = state.filterByTags.length === 0 || 
              (task.tags && state.filterByTags.every(tag => task.tags?.includes(tag)));
            
            if (matchesSearch && matchesStatus && matchesAssignee && matchesPriority && matchesTags) {
              return task;
            }
            
            if (task.subtasks) {
              const filteredSubtasks = task.subtasks
                .map(filterTask)
                .filter((t): t is Task => t !== null);
              if (filteredSubtasks.length > 0) {
                return { ...task, subtasks: filteredSubtasks };
              }
            }
            return null;
          };
          
          return state.tasks.map(filterTask).filter((t): t is Task => t !== null);
        },
        
        getPeriods: () => {
          const state = get();
          const addPeriod = state.granularity === 'week' 
            ? addWeeks 
            : state.granularity === 'month' 
              ? addMonths 
              : addQuarters;
              
          return Array.from(
            { length: state.periodsToShow },
            (_, i) => addPeriod(state.startDate, i)
          );
        },
        
        getTaskPosition: (task: Task) => {
          const state = get();
          const periods = state.getPeriods();
          
          const startPeriod = state.granularity === 'week'
            ? startOfWeek(task.startDate)
            : state.granularity === 'month'
              ? startOfMonth(task.startDate)
              : startOfQuarter(task.startDate);
              
          const periodIndex = periods.findIndex(
            (p) => p.getTime() === startPeriod.getTime()
          );
          
          const getDiff = state.granularity === 'week'
            ? (end: Date, start: Date) => differenceInWeeks(end, start) + 1
            : state.granularity === 'month'
              ? (end: Date, start: Date) => differenceInMonths(end, start) + 1
              : (end: Date, start: Date) => differenceInQuarters(end, start) + 1;
              
          const width = getDiff(task.endDate, task.startDate);
          
          return { periodIndex, width };
        }
      }),
      {
        name: 'gantt-storage'
      }
    )
  )
);

export default useGanttStore;