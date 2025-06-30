import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

interface UserAvatarProps {
  fullName?: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
  username?: string;
}

const UserAvatar = ({ fullName = 'Anonymous', avatarUrl, size = 'md', className = '', username }: UserAvatarProps) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const isAnonymous = fullName.toLowerCase().includes('anonymous');

  const getSizeValue = (): { width: string; height: string; sizeClass: string } => {
    if (typeof size === 'number') {
      return {
        width: `${size}px`,
        height: `${size}px`,
        sizeClass: `w-${size} h-${size}`,
      };
    }

    const sizeMap = {
      xs: { size: '6', value: '1.5rem' },
      sm: { size: '8', value: '2rem' },
      md: { size: '10', value: '2.5rem' },
      lg: { size: '12', value: '3rem' },
      xl: { size: '16', value: '4rem' },
      '2xl': { size: '20', value: '5rem' },
    };

    const mappedSize = sizeMap[size] || sizeMap.md;

    return {
      width: mappedSize.value,
      height: mappedSize.value,
      sizeClass: `w-${mappedSize.size} h-${mappedSize.size}`,
    };
  };

  const getAvatarUrl = (): string => {
    if (isAnonymous) {
      return `https://ui-avatars.com/api/?name=?&background=808080&color=ffffff&rounded=true&bold=true`;
    }

    if (!avatarUrl || hasError) {
      const encodedName = encodeURIComponent(fullName);
      return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=ffffff&rounded=true&bold=true`;
    }

    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      return `${baseUrl}${avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`}`;
    }
  };

  useEffect(() => {
    setImgSrc(getAvatarUrl());
    setHasError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl, fullName]);

  const handleError = () => {
    setHasError(true);
    setImgSrc(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=ffffff&rounded=true&bold=true`,
    );
  };

  const { width, height, sizeClass } = getSizeValue();

  // Determine if the avatar should be clickable (has username and not anonymous)
  const shouldBeClickable = !!username && !isAnonymous;

  // Generate the avatar image element
  const avatarImage = !imgSrc ? (
    <div
      className={`rounded-full bg-gray-200 ${sizeClass} ${className}`}
      style={!sizeClass ? { width, height } : undefined}
    />
  ) : (
    <img
      src={imgSrc}
      alt={`${fullName}'s avatar`}
      onError={handleError}
      className={`rounded-full object-cover ${sizeClass} ${className} ${shouldBeClickable ? 'cursor-pointer hover:opacity-90' : ''}`}
      style={!sizeClass ? { width, height } : undefined}
      width={width}
      height={height}
      loading="lazy"
    />
  );

  // If username is provided and not anonymous, wrap in Link component
  if (shouldBeClickable) {
    return <Link to={`/profile/${username}`}>{avatarImage}</Link>;
  }

  // Otherwise just return the avatar directly
  return avatarImage;
};

export default UserAvatar;
