import useAxios from '@/features/auth/hooks/useAxios';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { router } from './routes';
import './App.css';

function App() {
  useAxios();
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-center" autoClose={1000} hideProgressBar />
    </>
  );
}

export default App;
