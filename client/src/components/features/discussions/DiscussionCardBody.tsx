import { Attachment } from '@/types/AttachmentTypes';

interface DiscussionCardBodyProps {
  content: string;
  attachments: Attachment[];
}

const DiscussionCardBody: React.FC<DiscussionCardBodyProps> = ({ content, attachments }) => {
  const sortedImages = attachments.sort((a, b) => a.id - b.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-gray-700">{content}</p>
      </div>
      {attachments.length > 0 && (
        <div
          className={`grid gap-1 overflow-hidden rounded-lg ${attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {sortedImages.map((image) => (
            <img
              key={image.id}
              src={import.meta.env.VITE_API_URL + image.url}
              alt={image.originalName}
              className="h-40 w-full cursor-pointer object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionCardBody;
