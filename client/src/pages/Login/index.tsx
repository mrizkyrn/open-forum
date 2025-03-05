import LoginForm from "@/features/auth/components/LoginForm";

const Login = () => {
   return (
      <div className="flex justify-center items-center px-5 min-h-screen bg-[url('src/assets/background-pattern.jpg')] bg-cover bg-center">
         <LoginForm />
      </div>
   );
};

export default Login;
