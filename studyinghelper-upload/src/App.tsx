import { HashRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './features/dashboard/DashboardPage'
import CoursesPage from './features/courses/CoursesPage'
import SchedulePage from './features/schedule/SchedulePage'
import TasksPage from './features/tasks/TasksPage'
import NotesPage from './features/notes/NotesPage'
import ResourcesPage from './features/resources/ResourcesPage'
import ResourceFetcherPage from './features/resources/ResourceFetcher'
import NewsroomPage from './features/newsroom/NewsroomPage'
import FlashcardsPage from './features/flashcards/FlashcardsPage'
import ErrorBookPage from './features/errorbook/ErrorBookPage'
import PomodoroPage from './features/pomodoro/PomodoroPage'
import AIPage from './features/ai/AIPage'
import AnalyticsPage from './features/analytics/AnalyticsPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App(): React.ReactElement {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:id" element={<NotesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:id" element={<ResourcesPage />} />
          <Route path="/fetcher" element={<ResourceFetcherPage />} />
          <Route path="/newsroom" element={<NewsroomPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/errorbook" element={<ErrorBookPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}
