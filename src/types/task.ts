import { z } from 'zod';

export const TaskStatus = z.enum(['Not Started', 'In Progress', 'Completed', 'Blocked', 'On Hold']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(['Low', 'Medium', 'High', 'Critical']);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TaskHistoryEntry = z.object({
  id: z.string(),
  timestamp: z.date(),
  field: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  userId: z.string()
});

export const TaskComment = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  timestamp: z.date(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional()
});

export const ResourceAllocation = z.object({
  userId: z.string(),
  hours: z.number(),
  startDate: z.date(),
  endDate: z.date()
});

export const Task = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  progress: z.number().min(0).max(100),
  subtasks: z.array(z.lazy(() => Task)).optional(),
  parentId: z.string().optional(),
  assignee: z.string().optional(),
  status: TaskStatus,
  dependencies: z.array(z.string()).optional(),
  isExpanded: z.boolean().optional(),
  overridePercentage: z.boolean().optional(),
  overrideDuration: z.boolean().optional(),
  description: z.string().optional(),
  priority: TaskPriority.optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  comments: z.array(TaskComment).optional(),
  history: z.array(TaskHistoryEntry).optional(),
  isMilestone: z.boolean().optional(),
  resources: z.array(ResourceAllocation).optional(),
  isOnCriticalPath: z.boolean().optional(),
  customFields: z.record(z.string(), z.any()).optional()
});

export type Task = z.infer<typeof Task>;
export type TaskComment = z.infer<typeof TaskComment>;
export type TaskHistoryEntry = z.infer<typeof TaskHistoryEntry>;
export type ResourceAllocation = z.infer<typeof ResourceAllocation>;

export type TimelineGranularity = 'week' | 'month' | 'quarter';
export type ViewMode = 'timeline' | 'resources' | 'calendar' | 'board';