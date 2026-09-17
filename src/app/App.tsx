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
const BasicsPage = lazy(() => import('@/pages/BasicsPage'));
const AnnotationsPage = lazy(() => import('@/pages/AnnotationsPage'));
const BasicsGuidePage = lazy(() => import('@/pages/BasicsGuidePage'));
const FundamentalsPage = lazy(() => import('@/pages/FundamentalsPage'));
const FundamentalsChapterPage = lazy(() => import('@/pages/FundamentalsChapterPage'));
const FundamentalsRevisionPage = lazy(() => import('@/pages/FundamentalsRevisionPage'));
const JavaPage = lazy(() => import('@/pages/JavaPage'));
const JavaChapterPage = lazy(() => import('@/pages/JavaChapterPage'));
const JavaRevisionPage = lazy(() => import('@/pages/JavaRevisionPage'));
const JdbcPage = lazy(() => import('@/pages/JdbcPage'));
const JdbcChapterPage = lazy(() => import('@/pages/JdbcChapterPage'));
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
        <Route path="basics">
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <BasicsPage />
              </Suspense>
            }
          />
          <Route
            path="annotations"
            element={
              <Suspense fallback={<Loading />}>
                <AnnotationsPage />
              </Suspense>
            }
          />
          <Route
            path=":guideSlug"
            element={
              <Suspense fallback={<Loading />}>
                <BasicsGuidePage />
              </Suspense>
            }
          />
        </Route>
        <Route path="fundamentals">
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <FundamentalsPage />
              </Suspense>
            }
          />
          <Route
            path="revision"
            element={
              <Suspense fallback={<Loading />}>
                <FundamentalsRevisionPage />
              </Suspense>
            }
          />
          <Route
            path=":chapterSlug"
            element={
              <Suspense fallback={<Loading />}>
                <FundamentalsChapterPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="java">
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <JavaPage />
              </Suspense>
            }
          />
          <Route
            path="revision"
            element={
              <Suspense fallback={<Loading />}>
                <JavaRevisionPage />
              </Suspense>
            }
          />
          <Route
            path=":chapterSlug"
            element={
              <Suspense fallback={<Loading />}>
                <JavaChapterPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="jdbc">
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <JdbcPage />
              </Suspense>
            }
          />
          <Route
            path=":chapterSlug"
            element={
              <Suspense fallback={<Loading />}>
                <JdbcChapterPage />
              </Suspense>
            }
          />
        </Route>
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
