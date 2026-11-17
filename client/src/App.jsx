import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { useAuth } from './context/AuthContext';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage'));
const TodayPage = lazy(() => import('./pages/TodayPage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));

function RouteLoading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoading />;

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/today" replace /> : <AuthPage mode="login" />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/today" replace /> : <AuthPage mode="signup" />}
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/reports/weekly" element={<WeeklyReportPage />} />
          <Route path="/reports/monthly" element={<MonthlyReportPage />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/today' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}
