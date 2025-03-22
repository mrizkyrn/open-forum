import ErrorBoundary from '@/components/feedback/ErrorBoundary';
import LoadingPage from '@/components/feedback/LoadingPage';
import AdminLayout from '@/components/layouts/AdminLayout';
import MainLayout from '@/components/layouts/MainLayout';
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Lazy-loaded components
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const DiscussionDetail = lazy(() => import('@/pages/DiscussionDetail'));
const SpaceDetailPage = lazy(() => import('@/pages/SpaceDetail'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const OverviewPage = lazy(() => import('@/pages/Admin/OverviewPage'));
const UsersPage = lazy(() => import('@/pages/Admin/UsersPage'));
const ReportsPage = lazy(() => import('@/pages/Admin/ReportsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Wrap Suspense in a reusable function
const lazyLoad = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingPage />}>
    <Component />
  </Suspense>
);

const routes = [
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: lazyLoad(Home),
      },
      {
        path: '/discussions/:id',
        element: lazyLoad(DiscussionDetail),
      },
      {
        path: '/spaces/:slug',
        element: lazyLoad(SpaceDetailPage),
      },
      {
        path: '/search',
        element: lazyLoad(SearchPage),
      },
      {
        path: '/notifications',
        element: lazyLoad(NotificationsPage),
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: lazyLoad(OverviewPage),
      },
      {
        path: 'users',
        element: lazyLoad(UsersPage),
      },
      {
        path: 'reports',
        element: lazyLoad(ReportsPage),
      },
    ],
  },
  {
    path: '/login',
    element: lazyLoad(Login),
  },
  {
    path: '*',
    element: lazyLoad(NotFound),
  },
];

export const router = createBrowserRouter(routes);
