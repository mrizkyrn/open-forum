interface AvatarImageProps {
  fullName?: string;
  size: string | number;
}

const AvatarImage: React.FC<AvatarImageProps> = ({ fullName = 'Anonymous', size = 10 }) => {
  return (
    <img
      src={`https://ui-avatars.com/api/?name=${fullName}&background=random&rounded=true`}
      alt="avatar"
      className={`rounded-full object-cover w-${size} h-${size}`}
    />
  );
};

export default AvatarImage;
