import { useEffect } from 'react';
import useGanttStore from '@/store/useGanttStore';

export const useKeyboardShortcuts = () => {
  const {
    setIsAddingTask,
    deleteTask,
    selectedTaskId,
    setSearchTerm,
    toggleTaskExpansion,
    setShowCompleted
  } = useGanttStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Key combinations
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setIsAddingTask(true);
            break;
          case 'f':
            e.preventDefault();
            document.querySelector<HTMLInputElement>('[placeholder="Search tasks..."]')?.focus();
            break;
          case 'e':
            e.preventDefault();
            if (selectedTaskId) {
              toggleTaskExpansion(selectedTaskId);
            }
            break;
        }
      }

      // Delete task
      if (e.key === 'Delete' && selectedTaskId) {
        e.preventDefault();
        deleteTask(selectedTaskId);
      }

      // Toggle completed tasks visibility
      if (e.key === 'h' && e.altKey) {
        e.preventDefault();
        setShowCompleted(prev => !prev);
      }

      // Clear search
      if (e.key === 'Escape') {
        setSearchTerm('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId]);
};