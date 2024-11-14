import React from 'react';
import GanttToolbar from './GanttToolbar';
import TaskList from './TaskList';
import Timeline from './Timeline';
import useGanttStore from '@/store/useGanttStore';

export default function GanttChart() {
  return (
    <div className="flex h-screen flex-col">
      <GanttToolbar />
      <div className="flex flex-1 border rounded-lg m-4">
        <TaskList />
        <Timeline />
      </div>
    </div>
  );
}