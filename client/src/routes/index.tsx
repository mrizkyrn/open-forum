import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import Loading from '@/components/ui/Loading';
import MainLayout from '@/components/layouts/MainLayout';

// Lazy-loaded components
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Wrap Suspense in a reusable function
const lazyLoad = (Component: React.ComponentType) => (
  <Suspense fallback={<Loading />}>
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
