import { ThemeProvider } from '@/components/theme-provider';
import GanttChart from '@/components/gantt/GanttChart';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <GanttChart />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;