import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
// import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Companies from './pages/admin/Companies';
import Users from './pages/admin/Users';
import Templates from './pages/admin/Templates';
import Sites from './pages/organizations/Sites';
import Surveys from './pages/surveys/Surveys';
import SurveyEditor from './pages/surveys/SurveyEditor';
import SurveyBuilder from './pages/surveys/SurveyBuilder';
import SurveyDistribute from './pages/surveys/SurveyDistribute';
import SurveyRespond from './pages/surveys/SurveyRespond';
import TakeSurvey from './pages/public/TakeSurvey';
import ThankYou from './pages/public/ThankYou';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import SurveyAnalytics from './pages/analytics/SurveyAnalytics';
import ResponseDetails from './pages/analytics/ResponseDetails';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

import LandingPage from './pages/public/LandingPage';
import BookDemo from './pages/public/BookDemo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book-demo" element={<BookDemo />} />
            <Route path="/login" element={<Login />} />
            {/* <Route path="/register" element={<Register />} />  -- Removed as per request */}

            {/* Public survey response route - no auth required */}
            <Route path="/survey/:surveyId/respond" element={<SurveyRespond />} />
            <Route path="/survey/:surveyId/embed" element={<SurveyRespond />} />
            <Route path="/survey/:surveyId/take" element={<TakeSurvey />} />
            <Route path="/survey/:surveyId/thank-you" element={<ThankYou />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites"
              element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys"
              element={
                <ProtectedRoute>
                  <Surveys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id/edit"
              element={
                <ProtectedRoute>
                  <SurveyEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id/builder"
              element={
                <ProtectedRoute>
                  <SurveyBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id/distribute"
              element={
                <ProtectedRoute>
                  <SurveyDistribute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/surveys/:surveyId"
              element={
                <ProtectedRoute>
                  <SurveyAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/responses/:responseId"
              element={
                <ProtectedRoute>
                  <ResponseDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

