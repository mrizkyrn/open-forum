import FileDisplay from '@/shared/components/ui/file-displays/FileDisplay';
import ImageDisplay from '@/shared/components/ui/file-displays/ImageDisplay';
import { Attachment } from '@/shared/types/AttachmentTypes';
import { JSX } from 'react';
import { Link } from 'react-router-dom';

interface CommentCardBodyProps {
  content: string;
  attachments: Attachment[];
  isDeleted?: boolean;
}

const CommentCardBody: React.FC<CommentCardBodyProps> = ({ content, attachments = [], isDeleted = false }) => {
  const imageAttachments = attachments.filter((attachment) => attachment.isImage);
  const fileAttachments = attachments.filter((attachment) => !attachment.isImage);

  const sortedImages = imageAttachments.sort((a, b) => a.displayOrder - b.displayOrder);
  const sortedFiles = fileAttachments.sort((a, b) => a.displayOrder - b.displayOrder);

  // Parse comment content for @mentions
  const renderContentWithMentions = (text: string) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the styled mention
      const username = match[1];
      parts.push(
        <Link
          to={`/profile/${username}`}
          key={`mention-${match.index}`}
          className="text-primary font-medium hover:underline"
        >
          @{username}
        </Link>,
      );

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last mention
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="flex flex-col gap-2">
      {isDeleted ? (
        <p className="text-sm text-gray-500 italic">This comment has been deleted.</p>
      ) : (
        <>
          {/* Comment text with mentions */}
          <p className="text-sm text-gray-700">{renderContentWithMentions(content)}</p>

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
        </>
      )}
    </div>
  );
};

export default CommentCardBody;
