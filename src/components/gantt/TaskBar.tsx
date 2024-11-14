import React from 'react';
import { isWithinInterval } from 'date-fns';
import { Milestone, Flag } from 'lucide-react';
import useGanttStore from '@/store/useGanttStore';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TaskBarProps {
  task: Task;
  isSubtask?: boolean;
}

export default function TaskBar({ task, isSubtask = false }: TaskBarProps) {
  const { getPeriods, getTaskPosition, periodsToShow } = useGanttStore();
  const periods = getPeriods();

  if (
    !isWithinInterval(task.startDate, {
      start: periods[0],
      end: periods[periods.length - 1],
    })
  ) {
    return null;
  }

  const { periodIndex, width } = getTaskPosition(task);
  const left = `${(periodIndex * 100) / periodsToShow}%`;
  const barWidth = `${(width * 100) / periodsToShow}%`;

  const getStatusColor = () => {
    switch (task.status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Blocked': return 'bg-red-500';
      case 'On Hold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIndicator = () => {
    switch (task.priority) {
      case 'Critical': return 'border-l-4 border-red-500';
      case 'High': return 'border-l-4 border-orange-500';
      case 'Medium': return 'border-l-4 border-yellow-500';
      case 'Low': return 'border-l-4 border-green-500';
      default: return '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute h-6 top-2 rounded flex items-center overflow-hidden',
              getPriorityIndicator(),
              task.isOnCriticalPath && 'ring-2 ring-red-500 ring-offset-2',
              isSubtask ? 'bg-secondary/30' : 'bg-primary/30'
            )}
            style={{
              left,
              width: barWidth,
            }}
          >
            <div
              className={cn(
                'h-full transition-all duration-300',
                getStatusColor()
              )}
              style={{ width: `${task.progress}%` }}
            />
            <span className="absolute inset-0 px-2 flex items-center justify-between text-xs">
              <span className="font-medium truncate flex items-center gap-1">
                {task.isMilestone && <Milestone className="h-3 w-3" />}
                {task.title}
                {task.isOnCriticalPath && <Flag className="h-3 w-3 text-red-500" />}
              </span>
              <span>{task.progress}%</span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p className="font-medium">{task.title}</p>
            <div className="text-xs space-y-1">
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
              {task.assignee && <p>Assigned to: {task.assignee}</p>}
              {task.estimatedHours && (
                <p>
                  Hours: {task.actualHours || 0}/{task.estimatedHours} 
                  ({Math.round((task.actualHours || 0) / task.estimatedHours * 100)}%)
                </p>
              )}
              {task.tags?.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.map(tag => (
                    <span key={tag} className="bg-secondary px-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}