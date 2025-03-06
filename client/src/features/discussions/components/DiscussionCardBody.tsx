import { Attachment } from '@/types/AttachmentTypes';
import FileDisplay from '@/components/ui/FileDisplay';
import ImageDisplay from '@/components/ui/ImageDisplay';

interface DiscussionCardBodyProps {
  content: string;
  attachments: Attachment[];
}

const DiscussionCardBody: React.FC<DiscussionCardBodyProps> = ({ content, attachments }) => {
  const imageAttachments = attachments.filter((attachment) => attachment.isImage);
  const fileAttachments = attachments.filter((attachment) => !attachment.isImage);

  const sortedImages = imageAttachments.sort((a, b) => a.displayOrder - b.displayOrder);
  const sortedFiles = fileAttachments.sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-gray-700">{content}</p>
      </div>

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
  );
};

export default DiscussionCardBody;
