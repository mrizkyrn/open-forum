import LoginForm from '@/features/auth/components/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[url('/background-pattern.jpg')] bg-cover bg-center px-5">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
