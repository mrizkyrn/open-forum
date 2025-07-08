import RegisterForm from '@/features/auth/components/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[url('src/assets/background-pattern.jpg')] bg-cover bg-center px-5">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
