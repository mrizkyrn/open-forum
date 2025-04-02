import ErrorBoundary from '@/components/feedback/ErrorBoundary';
import LoadingPage from '@/components/feedback/LoadingPage';
import AdminLayout from '@/components/layouts/AdminLayout';
import MainLayout from '@/components/layouts/MainLayout';
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Lazy-loaded components
const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DiscussionDetailPage = lazy(() => import('@/pages/DiscussionDetailPage'));
const SpacesPage = lazy(() => import('@/pages/SpacesPage'));
const SpaceDetailPage = lazy(() => import('@/pages/SpaceDetail'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const BookmarksPage = lazy(() => import('@/pages/BookmarksPage'));
const OverviewPage = lazy(() => import('@/pages/Admin/OverviewPage'));
const UserManagementPage = lazy(() => import('@/pages/Admin/UserManagementPage'));
const DiscussionManagementPage = lazy(() => import('@/pages/Admin/DiscussionManagementPage'));
const SpaceManagementPage = lazy(() => import('@/pages/Admin/SpaceManagementPage'));
const ReportManagementPage = lazy(() => import('@/pages/Admin/ReportManagementPage'));
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
        element: lazyLoad(HomePage),
      },
      {
        path: '/spaces',
        element: lazyLoad(SpacesPage),
      },
      {
        path: '/discussions/:id',
        element: lazyLoad(DiscussionDetailPage),
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
      {
        path: '/bookmarks',
        element: lazyLoad(BookmarksPage),
      }
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
        element: lazyLoad(UserManagementPage),
      },
      {
        path: 'discussions',
        element: lazyLoad(DiscussionManagementPage),
      },
      {
        path: 'spaces',
        element: lazyLoad(SpaceManagementPage),
      },
      {
        path: 'reports',
        element: lazyLoad(ReportManagementPage),
      },
    ],
  },
  {
    path: '/login',
    element: lazyLoad(LoginPage),
  },
  {
    path: '*',
    element: lazyLoad(NotFound),
  },
];

export const router = createBrowserRouter(routes);
