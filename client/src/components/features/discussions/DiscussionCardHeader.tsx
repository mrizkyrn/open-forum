import React from 'react';

interface DiscussionCardHeaderProps {
  imageUrl: string;
  fullName: string | undefined;
}

const DiscussionCardHeader: React.FC<DiscussionCardHeaderProps> = ({ imageUrl, fullName }) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <img src={imageUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
        <div className="flex flex-col justify-center">
          {fullName ? (
            <h3 className="text-base font-semibold">{fullName}</h3>
          ) : (
            <h3 className="text-base font-semibold">Anonymous</h3>
          )}
          <p className="text-xs text-gray-500">University - 5 hours ago</p>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCardHeader;
