import RegisterForm from '@/features/auth/components/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 md:bg-[url('/background-pattern.jpg')] md:bg-cover md:bg-center">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
