interface TabButtonProps<T extends string> {
  tab: T;
  activeTab: T;
  icon: React.ReactNode;
  label: string;
  onClick: (tab: T) => void;
  className?: string;
}

const TabButton = <T extends string>({ tab, activeTab, icon, label, onClick, className = '' }: TabButtonProps<T>) => {
  const isActive = activeTab === tab;

  const buttonClasses = [
    'flex w-full items-center justify-center border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors',
    isActive
      ? 'border-green-600 text-green-600'
      : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} onClick={() => onClick(tab)} aria-current={isActive ? 'page' : undefined}>
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
};

export default TabButton;
