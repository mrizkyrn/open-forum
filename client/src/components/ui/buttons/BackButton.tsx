import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  text?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ text, className }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <button
      onClick={handleBackClick}
      className={`mb-4 hover:text-gray-900"> flex items-center gap-2 text-gray-600 ${className}`}
    >
      <ArrowLeft size={18} />
      <span>{text || 'Back'}</span>
    </button>
  );
};

export default BackButton;
