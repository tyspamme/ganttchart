import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TaskForm from './TaskForm';
import useGanttStore from '@/store/useGanttStore';
import { format } from 'date-fns';
import { TimelineGranularity } from '@/types/task';

export default function GanttToolbar() {
  const {
    startDate,
    granularity,
    getPeriods,
    setStartDate,
    setGranularity,
    setSearchTerm,
    isAddingTask,
    setIsAddingTask,
    editingTaskId,
    setEditingTaskId,
    searchTerm,
  } = useGanttStore();

  const periods = getPeriods();

  const moveTimeline = (direction: 'left' | 'right') => {
    const addPeriod = granularity === 'week'
      ? addWeeks
      : granularity === 'month'
        ? addMonths
        : addQuarters;
    
    setStartDate(
      direction === 'left'
        ? addPeriod(startDate, -1)
        : addPeriod(startDate, 1)
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
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
        <Label htmlFor="granularity">View:</Label>
        <Select
          value={granularity}
          onValueChange={(value: TimelineGranularity) => setGranularity(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
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

      <Dialog 
        open={isAddingTask || !!editingTaskId} 
        onOpenChange={open => {
          setIsAddingTask(open);
          if (!open) setEditingTaskId(null);
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTaskId ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}