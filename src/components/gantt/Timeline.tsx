import React from 'react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import useGanttStore from '@/store/useGanttStore';
import TaskBar from './TaskBar';
import DependencyArrows from './DependencyArrows';

export default function Timeline() {
  const { getPeriods, getFilteredTasks, granularity } = useGanttStore();
  const periods = getPeriods();
  const tasks = getFilteredTasks();

  return (
    <div className="flex-1">
      <div className="flex border-b bg-muted">
        {periods.map(period => (
          <div
            key={period.getTime()}
            className="flex-1 p-2 text-center border-r text-sm font-medium"
          >
            {format(period, 
              granularity === 'week' 
                ? 'MMM dd, yyyy' 
                : granularity === 'month' 
                  ? 'MMM yyyy' 
                  : 'QQQ yyyy'
            )}
          </div>
        ))}
      </div>
      <ScrollArea className="h-[calc(100%-2.5rem)]">
        <div className="relative">
          {tasks.map(task => (
            <React.Fragment key={task.id}>
              <div className="relative h-10 border-b">
                <TaskBar task={task} />
                <DependencyArrows task={task} />
              </div>
              {task.isExpanded && task.subtasks?.map(subtask => (
                <div key={subtask.id} className="relative h-10 border-b">
                  <TaskBar task={subtask} isSubtask />
                  <DependencyArrows task={subtask} />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}