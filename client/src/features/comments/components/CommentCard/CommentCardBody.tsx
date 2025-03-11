import { Attachment } from '@/types/AttachmentTypes';
import ImageDisplay from '@/components/ui/file-displays/ImageDisplay';
import FileDisplay from '@/components/ui/file-displays/FileDisplay';

interface CommentCardBodyProps {
  content: string;
  attachments: Attachment[];
}

const CommentCardBody: React.FC<CommentCardBodyProps> = ({ content, attachments = [] }) => {
  const imageAttachments = attachments.filter((attachment) => attachment.isImage);
  const fileAttachments = attachments.filter((attachment) => !attachment.isImage);

  const sortedImages = imageAttachments.sort((a, b) => a.displayOrder - b.displayOrder);
  const sortedFiles = fileAttachments.sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex flex-col gap-2">
      {/* Comment text */}
      <p className="text-sm text-gray-700">{content}</p>

      {/* Image attachments - more compact for comments */}
      {sortedImages.length > 0 && (
        <div
          className={`grid gap-1 overflow-hidden rounded-lg ${sortedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {sortedImages.map((image) => (
            <ImageDisplay key={image.id} image={image} />
          ))}
        </div>
      )}

      {/* File attachments - more compact for comments */}
      {sortedFiles.length > 0 && (
        <div className="flex flex-col gap-1">
          {sortedFiles.map((file) => (
            <FileDisplay key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentCardBody;
