import LoginForm from '@/features/auth/components/LoginForm';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 md:bg-[url('/background-pattern.jpg')] md:bg-cover md:bg-center">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
