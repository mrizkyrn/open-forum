import TabButton from '../ui/buttons/TabButton';

interface TabConfig {
  icon: React.ReactNode;
  label: string;
}

interface TabNavigationProps<T extends string> {
  tabs: Record<T, TabConfig>;
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
  ariaLabel?: string;
}

const TabNavigation = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  ariaLabel = 'Tabs',
}: TabNavigationProps<T>) => {
  const navClasses = ['border border-b-0 border-gray-100 bg-white', className].filter(Boolean).join(' ');

  return (
    <div className={navClasses}>
      <nav className="flex" aria-label={ariaLabel}>
        {(Object.entries(tabs) as [T, TabConfig][]).map(([tab, config]) => (
          <TabButton
            key={tab}
            tab={tab}
            activeTab={activeTab}
            icon={config.icon}
            label={config.label}
            onClick={onTabChange}
          />
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
