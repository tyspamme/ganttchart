import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import useGanttStore from '@/store/useGanttStore';
import { eachDayOfInterval, format } from 'date-fns';

export default function ResourceView() {
  const { tasks, startDate, getPeriods } = useGanttStore();
  const periods = getPeriods();

  const calculateResourceAllocation = () => {
    const days = eachDayOfInterval({
      start: startDate,
      end: periods[periods.length - 1]
    });

    const resourceData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const allocation: Record<string, number> = {};

      tasks.forEach(task => {
        if (task.resources) {
          task.resources.forEach(resource => {
            if (isWithinInterval(day, { start: resource.startDate, end: resource.endDate })) {
              allocation[resource.userId] = (allocation[resource.userId] || 0) + resource.hours;
            }
          });
        }
      });

      return {
        date: dayStr,
        ...allocation
      };
    });

    return resourceData;
  };

  const data = calculateResourceAllocation();
  const resources = Array.from(
    new Set(tasks.flatMap(t => t.resources?.map(r => r.userId) || []))
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Resource Allocation</h2>
      <BarChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {resources.map((resource, index) => (
          <Bar
            key={resource}
            dataKey={resource}
            stackId="a"
            fill={`hsl(${index * 360 / resources.length}, 70%, 50%)`}
          />
        ))}
      </BarChart>
    </div>
  );
}