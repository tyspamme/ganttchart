import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import TaskItem from './TaskItem';
import useGanttStore from '@/store/useGanttStore';

export default function TaskList() {
  const { getFilteredTasks, moveTask } = useGanttStore();
  
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    moveTask(result.draggableId, result.destination.index);
  };

  const tasks = getFilteredTasks();

  return (
    <div className="w-1/4 border-r">
      <div className="p-2 border-b bg-muted font-medium">Tasks</div>
      <ScrollArea className="h-[calc(100%-2.5rem)]">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskItem task={task} level={0} />
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
  );
}