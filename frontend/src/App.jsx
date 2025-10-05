import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { FilterProvider } from './context/FilterContext'
import { ThemeProvider } from './context/ThemeContext'
import FilterSidebar from './components/Filters/FilterSidebar'
import ScreenSizeWarning from './components/common/ScreenSizeWarning'
import { toast } from './utils/toast'
import DashboardContent from './components/Dashboard/DashboardContent'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      onError: (error) => {
        const message = error?.message || 'Failed to fetch data'
        toast.error(message)
      },
    },
  },
})

export function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ScreenSizeWarning>
          <FilterProvider>
            <div className="flex h-screen bg-background dark:bg-discord-darkest overflow-hidden">
              <FilterSidebar onCollapseChange={setIsSidebarCollapsed} />
              <DashboardContent isSidebarCollapsed={isSidebarCollapsed} />
            </div>
          </FilterProvider>
        </ScreenSizeWarning>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
