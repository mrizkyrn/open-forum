import { SpaceType } from '../types';

interface SpaceBadgeProps {
  spaceType?: SpaceType;
}

const SpaceBadge = ({ spaceType }: SpaceBadgeProps) => {
  const colors: Record<SpaceType, { bg: string; text: string }> = {
    [SpaceType.GENERAL]: { bg: 'bg-gray-100', text: 'text-gray-700' },
    [SpaceType.INTEREST]: { bg: 'bg-purple-100', text: 'text-purple-700' },
    [SpaceType.PROFESSIONAL]: { bg: 'bg-blue-100', text: 'text-blue-700' },
    [SpaceType.COMMUNITY]: { bg: 'bg-green-100', text: 'text-green-700' },
    [SpaceType.ORGANIZATION]: { bg: 'bg-orange-100', text: 'text-orange-700' },
    [SpaceType.EVENT]: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    [SpaceType.SUPPORT]: { bg: 'bg-pink-100', text: 'text-pink-700' },
    [SpaceType.OTHER]: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const labels: Record<SpaceType, string> = {
    [SpaceType.GENERAL]: 'General',
    [SpaceType.INTEREST]: 'Interest',
    [SpaceType.PROFESSIONAL]: 'Professional',
    [SpaceType.COMMUNITY]: 'Community',
    [SpaceType.ORGANIZATION]: 'Organization',
    [SpaceType.EVENT]: 'Event',
    [SpaceType.SUPPORT]: 'Support',
    [SpaceType.OTHER]: 'Other',
  };
  const safeSpaceType = spaceType && colors[spaceType] ? spaceType : SpaceType.OTHER;
  const color = colors[safeSpaceType];
  const label = labels[safeSpaceType];

  return <span className={`rounded-full px-2 py-0.5 text-xs ${color.bg} ${color.text} font-medium`}>{label}</span>;
};

export default SpaceBadge;
