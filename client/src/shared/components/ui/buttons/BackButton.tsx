import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  text?: string;
  backTo?: string;
  className?: string;
}

const BackButton = ({ text, backTo, className }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBackClick}
      className={`mb-4 flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900 ${className}`}
    >
      <ArrowLeft size={18} />
      <span>{text || 'Back'}</span>
    </button>
  );
};

export default BackButton;
