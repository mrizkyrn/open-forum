import { ChevronRight, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PopularTopicItemProps {
  tag: string;
  count: number;
}

const PopularTopicItem: React.FC<PopularTopicItemProps> = ({ tag, count }) => {
  const navigate = useNavigate();

  const handleTagClick = () => {
    navigate(`/search?tags=${encodeURIComponent(tag)}`);
  };

  return (
    <div
      className="group cursor-pointer flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-green-50"
      onClick={handleTagClick}
      role="button"
    >
      {/* Fixed width tag icon */}
      <div className="flex items-center">
        <Hash size={16} className="mr-2 text-gray-400 group-hover:text-green-500" />
        <div>
          <div className="font-medium text-gray-800 group-hover:text-green-700">{tag}</div>
          <div className="text-xs text-gray-500">{count} discussions</div>
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500" />
    </div>
  );
};

export default PopularTopicItem;
