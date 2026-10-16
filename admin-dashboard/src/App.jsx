import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AppProvider } from './context/AppContext.jsx'
import useAuth from './hooks/useAuth.js'
import LoginPage from './pages/LoginPage.jsx'
import AppLayout from './layout/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DailyVerseManagement from './pages/DailyVerseManagement.jsx'
import DailyQuestionManagement from './pages/DailyQuestionManagement.jsx'
import WeeklyQuizzesManagement from './pages/WeeklyQuizzesManagement.jsx'
import RankingPage from './pages/RankingPage.jsx'
import UsersManagement from './pages/UsersManagement.jsx'
import UserDetailPage from './pages/UserDetailPage.jsx'
import Settings from './pages/Settings.jsx'
import QuizResultsManagement from './pages/QuizResultsManagement.jsx'

function App() {
  const auth = useAuth()

  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              auth.isAuthenticated ? (
                <AppLayout />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="verses" element={<DailyVerseManagement />} />
            <Route path="questions" element={<DailyQuestionManagement />} />
            <Route path="weekly-quizzes" element={<WeeklyQuizzesManagement />} />
            <Route path="quiz-results/:quizType/:quizId" element={<QuizResultsManagement />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <ToastContainer position="bottom-left" rtl theme="colored" />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
