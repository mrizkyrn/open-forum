interface AvatarImageProps {
  fullName?: string;
  avatarUrl?: string | null;
  size: string | number;
}

const AvatarImage: React.FC<AvatarImageProps> = ({ fullName = 'Anonymous', avatarUrl, size = 10 }) => {
  const avatarSrc = avatarUrl
    ? import.meta.env.VITE_API_URL + avatarUrl
    : `https://ui-avatars.com/api/?name=${fullName}&background=random&rounded=true`;

  return <img src={avatarSrc} alt="avatar" className={`rounded-full object-cover w-${size} h-${size}`} />;
};

export default AvatarImage;
