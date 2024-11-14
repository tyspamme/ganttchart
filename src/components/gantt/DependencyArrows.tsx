import React from 'react';
import useGanttStore from '@/store/useGanttStore';
import { Task } from '@/types/task';

interface DependencyArrowsProps {
  task: Task;
}

export default function DependencyArrows({ task }: DependencyArrowsProps) {
  const { tasks, getTaskPosition, periodsToShow } = useGanttStore();

  if (!task.dependencies) return null;

  return (
    <>
      {task.dependencies.map(depId => {
        const dependentTask = tasks.find(t => t.id === depId) || 
          tasks.flatMap(t => t.subtasks || []).find(st => st.id === depId);
          
        if (!dependentTask) return null;

        const startPos = getTaskPosition(dependentTask);
        const endPos = getTaskPosition(task);

        const startX = ((startPos.periodIndex + startPos.width) * 100) / periodsToShow;
        const startY = 50;
        const endX = (endPos.periodIndex * 100) / periodsToShow;
        const endY = 50;

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
        );
      })}
    </>
  );
}