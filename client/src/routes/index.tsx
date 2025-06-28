import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import ErrorBoundary from '@/shared/components/feedback/ErrorBoundary';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import AdminLayout from '@/shared/components/layouts/AdminLayout';
import MainLayout from '@/shared/components/layouts/MainLayout';

// Public pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Main app pages
const DiscussionDetailPage = lazy(() => import('@/pages/DiscussionDetailPage'));
const SpacesPage = lazy(() => import('@/pages/SpacesPage'));
const SpaceDetailPage = lazy(() => import('@/pages/SpaceDetail'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'));
const BookmarksPage = lazy(() => import('@/pages/BookmarksPage'));

// Admin pages
const OverviewPage = lazy(() => import('@/pages/Admin/OverviewPage'));
const UserManagementPage = lazy(() => import('@/pages/Admin/UserManagementPage'));
const FacultyManagementPage = lazy(() => import('@/pages/Admin/FacultyManagementPage'));
const StudyProgramManagementPage = lazy(() => import('@/pages/Admin/StudyProgramManagementPage'));
const DiscussionManagementPage = lazy(() => import('@/pages/Admin/DiscussionManagementPage'));
const SpaceManagementPage = lazy(() => import('@/pages/Admin/SpaceManagementPage'));
const ReportManagementPage = lazy(() => import('@/pages/Admin/ReportManagementPage'));

const lazyLoad = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingIndicator fullscreen fullWidth />}>
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
        path: '/explore',
        element: lazyLoad(ExplorePage),
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
        path: '/profile/:username',
        element: lazyLoad(UserProfilePage),
      },
      {
        path: '/bookmarks',
        element: lazyLoad(BookmarksPage),
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
        element: lazyLoad(UserManagementPage),
      },
      {
        path: 'faculties',
        element: lazyLoad(FacultyManagementPage),
      },
      {
        path: 'study-programs',
        element: lazyLoad(StudyProgramManagementPage),
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
