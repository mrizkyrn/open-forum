import FileDisplay from '@/components/ui/file-displays/FileDisplay';
import ImageDisplay from '@/components/ui/file-displays/ImageDisplay';
import { Attachment } from '@/types/AttachmentTypes';
import { useNavigate } from 'react-router-dom';

interface DiscussionCardBodyProps {
  content: string;
  attachments: Attachment[];
  tags?: string[];
}

const DiscussionCardBody: React.FC<DiscussionCardBodyProps> = ({ content, attachments = [], tags = [] }) => {
  const navigate = useNavigate();

  const imageAttachments = attachments.filter((attachment) => attachment.isImage);
  const fileAttachments = attachments.filter((attachment) => !attachment.isImage);

  const sortedImages = imageAttachments.sort((a, b) => a.displayOrder - b.displayOrder);
  const sortedFiles = fileAttachments.sort((a, b) => a.displayOrder - b.displayOrder);

  const handleTagClick = (e: React.MouseEvent<HTMLSpanElement>, tag: string) => {
    e.stopPropagation();
    navigate(`/search?tags=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div>
        <p className="text-gray-700">{content}</p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => handleTagClick(e, tag)}
              className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(sortedImages.length > 0 || sortedFiles.length > 0) && (
        <div className="flex flex-col gap-1">
          {/* Image attachments grid */}
          {sortedImages.length > 0 && (
            <div
              className={`grid gap-1 overflow-hidden rounded-lg ${sortedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              {sortedImages.map((image) => (
                <ImageDisplay key={image.id} image={image} />
              ))}
            </div>
          )}

          {/* Document attachments list */}
          {sortedFiles.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {sortedFiles.map((file) => (
                <FileDisplay key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscussionCardBody;
