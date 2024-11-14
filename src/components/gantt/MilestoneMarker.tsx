import React from 'react';
import { Milestone } from 'lucide-react';
import { Task } from '@/types/task';
import useGanttStore from '@/store/useGanttStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MilestoneMarkerProps {
  task: Task;
}

export default function MilestoneMarker({ task }: MilestoneMarkerProps) {
  const { getTaskPosition, periodsToShow } = useGanttStore();

  if (!task.isMilestone) return null;

  const { periodIndex } = getTaskPosition(task);
  const left = `${(periodIndex * 100) / periodsToShow}%`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute top-0 transform -translate-x-1/2"
            style={{ left }}
          >
            <div className="flex flex-col items-center">
              <Milestone className="h-6 w-6 text-primary" />
              <div className="h-full border-l border-dashed border-primary" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              Milestone: {format(task.startDate, 'MMM d, yyyy')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}