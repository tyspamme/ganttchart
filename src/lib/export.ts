import { Task } from '@/types/task';

export const exportToCSV = (tasks: Task[]) => {
  const headers = [
    'ID',
    'Title',
    'Start Date',
    'End Date',
    'Progress',
    'Status',
    'Priority',
    'Assignee',
    'Estimated Hours',
    'Actual Hours',
    'Tags'
  ];

  const flattenTasks = (tasks: Task[], parentTitle = ''): any[] => {
    return tasks.flatMap(task => {
      const row = [
        task.id,
        parentTitle ? `${parentTitle} > ${task.title}` : task.title,
        task.startDate.toISOString(),
        task.endDate.toISOString(),
        task.progress,
        task.status,
        task.priority || '',
        task.assignee || '',
        task.estimatedHours || '',
        task.actualHours || '',
        task.tags?.join(', ') || ''
      ];

      if (task.subtasks?.length) {
        return [row, ...flattenTasks(task.subtasks, task.title)];
      }

      return [row];
    });
  };

  const csvContent = [
    headers.join(','),
    ...flattenTasks(tasks).map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gantt_export_${new Date().toISOString()}.csv`;
  link.click();
};

export const exportToJSON = (tasks: Task[]) => {
  const jsonString = JSON.stringify(tasks, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gantt_export_${new Date().toISOString()}.json`;
  link.click();
};