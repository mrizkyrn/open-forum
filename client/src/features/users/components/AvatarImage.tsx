import { useState, useEffect } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

interface AvatarImageProps {
  fullName?: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
  hasBorder?: boolean;
  borderColor?: string;
}

const AvatarImage: React.FC<AvatarImageProps> = ({
  fullName = 'Anonymous',
  avatarUrl,
  size = 'md',
  className = '',
  hasBorder = false,
  borderColor = 'border-gray-200',
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const isAnonymous = fullName.toLowerCase().includes('anonymous');

  const getSizeValue = (): { width: string; height: string; sizeClass: string } => {
    if (typeof size === 'number') {
      return {
        width: `${size}px`,
        height: `${size}px`,
        sizeClass: '',
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
  const borderStyle = hasBorder ? `border-2 ${borderColor}` : '';

  if (!imgSrc) {
    return (
      <div
        className={`rounded-full bg-gray-200 ${sizeClass} ${borderStyle} ${className}`}
        style={!sizeClass ? { width, height } : undefined}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt={`${fullName}'s avatar`}
      onError={handleError}
      className={`rounded-full object-cover ${sizeClass} ${borderStyle} ${className}`}
      style={!sizeClass ? { width, height } : undefined}
      width={width}
      height={height}
      loading="lazy"
    />
  );
};

export default AvatarImage;
