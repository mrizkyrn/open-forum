interface LogoProps {
  collapsed?: boolean;
}

const Logo = ({ collapsed = false }: LogoProps) => (
  <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
      <span className="text-primary font-bold">U</span>
    </div>
    {!collapsed && <h1 className="ml-2 text-base font-semibold tracking-tight text-gray-800">Open Forum</h1>}
  </div>
);

export default Logo;
