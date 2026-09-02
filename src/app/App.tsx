import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/app/layouts/AppShell';
import { useThemeSync } from '@/lib/theme';
import { Loading } from '@/components/ui/Loading';

const HomePage = lazy(() => import('@/pages/HomePage'));
const PathPage = lazy(() => import('@/pages/PathPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ModulePage = lazy(() => import('@/pages/ModulePage'));
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const DemosPage = lazy(() => import('@/pages/DemosPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export function App() {
  useThemeSync();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<Loading />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="path"
          element={
            <Suspense fallback={<Loading />}>
              <PathPage />
            </Suspense>
          }
        />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<Loading />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="demos"
          element={
            <Suspense fallback={<Loading />}>
              <DemosPage />
            </Suspense>
          }
        />
        <Route path="learn">
          <Route index element={<Navigate to="/path" replace />} />
          <Route
            path=":moduleSlug"
            element={
              <Suspense fallback={<Loading />}>
                <ModulePage />
              </Suspense>
            }
          />
          <Route
            path=":moduleSlug/:lessonSlug"
            element={
              <Suspense fallback={<Loading />}>
                <LessonPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <Suspense fallback={<Loading />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
