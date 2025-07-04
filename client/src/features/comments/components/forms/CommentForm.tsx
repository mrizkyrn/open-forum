import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { commentApi } from '@/features/comments/services';
import { CreateCommentRequest, UpdateCommentRequest } from '@/features/comments/types';
import UserAvatar from '@/features/users/components/UserAvatar';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import FilePreview from '@/shared/components/ui/file-displays/FilePreview';
import { Attachment } from '@/shared/types/AttachmentTypes';
import { ALLOWED_FILE_TYPES, MAX_COMMENT_FILES, MAX_FILE_SIZE } from '@/utils/constants';
import { getFromCurrentUrl } from '@/utils/helpers';
import MentionTextarea from './MentionTextArea';

interface CommentFormProps {
  discussionId: number;
  commentId?: number;
  parentId?: number | null;
  isEditing?: boolean;
  initialValue?: string;
  existingAttachments?: Attachment[];
  onClickOutside?: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CommentForm = ({
  discussionId,
  commentId,
  parentId,
  isEditing = false,
  initialValue = '',
  existingAttachments = [],
  onClickOutside,
  onSuccess,
  onCancel,
}: CommentFormProps) => {
  const isReply = Boolean(parentId);

  const [value, setValue] = useState(initialValue);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<number[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlCommentId = getFromCurrentUrl('comment') ? Number(getFromCurrentUrl('comment')) : null;

  // Update textarea value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Handle clicks outside the form
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (e.target as Element).closest('button') ||
        (e.target as Element).closest('a') ||
        (e.target as Element).closest('[role="button"]')
      ) {
        return;
      }

      setIsFocused(false);

      if (onClickOutside && !value.trim()) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside, value]);

  const { mutate: submitComment, isPending } = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing && commentId) {
        return await commentApi.updateComment(commentId, data);
      } else {
        return await commentApi.createComment(discussionId, data);
      }
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'], exact: false });

      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', parentId] });

        if (urlCommentId && parentId === urlCommentId) {
          queryClient.invalidateQueries({ queryKey: ['comment', parentId] });
        }
      }

      if (isEditing && commentId) {
        queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
      }

      // Reset form
      setValue('');
      setFiles([]);
      setAttachmentsToRemove([]);
      setIsFocused(false);

      if (onSuccess) {
        onSuccess();
      }

      toast.success(isEditing ? 'Comment updated' : 'Comment posted');
    },
    onError: (error) => {
      console.error('Error with comment:', error);
      toast.error(isEditing ? 'Failed to update comment' : 'Failed to post comment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      if (isEditing) {
        // For updating existing comment
        const updateData: UpdateCommentRequest = {
          content: value.trim(),
          files: files.length > 0 ? files : undefined,
          attachmentsToRemove: attachmentsToRemove.length > 0 ? attachmentsToRemove : [],
        };
        submitComment(updateData);
      } else {
        // For creating new comment
        const createData: CreateCommentRequest = {
          content: value.trim(),
          parentId: isReply ? parentId : null,
          files: files.length > 0 ? files : undefined,
        };
        submitComment(createData);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const remainingExistingFiles = existingAttachments.length - attachmentsToRemove.length;
    const totalFilesAfterUpload = remainingExistingFiles + files.length + selectedFiles.length;

    if (totalFilesAfterUpload > MAX_COMMENT_FILES) {
      setFileErrors(`You can upload a maximum of ${MAX_COMMENT_FILES} files.`);
      return;
    }

    const invalidType = selectedFiles.find((file) => !ALLOWED_FILE_TYPES.includes(file.type));
    if (invalidType) {
      setFileErrors(`File type not supported. Allowed types: images and PDF.`);
      return;
    }

    const maxSize = MAX_FILE_SIZE;
    const oversizeFile = selectedFiles.find((file) => file.size > maxSize);
    if (oversizeFile) {
      setFileErrors(`File size exceeds the 3MB limit.`);
      return;
    }

    setFileErrors(null);
    setFiles((prev) => [...prev, ...selectedFiles]);

    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    setFileErrors(null);
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToRemove((prev) => [...prev, attachmentId]);
  };

  const getActionText = () => {
    if (isEditing) return 'Save Changes';
    if (isReply) return `Reply`;
    return 'Post Comment';
  };

  // Filter existing attachments to show only those not marked for removal
  const filteredAttachments = existingAttachments.filter((attachment) => !attachmentsToRemove.includes(attachment.id));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-white">
      <div className="flex items-start gap-2">
        {isReply || isEditing ? null : <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="md" />}
        <div className="flex w-full flex-col gap-3">
          {/* Mention Textarea Component */}
          <MentionTextarea
            value={value}
            onChange={setValue}
            onFocus={() => setIsFocused(true)}
            isReply={isReply}
            initialFocus={isReply || isEditing}
          />

          {/* File previews */}
          {((isEditing && filteredAttachments.length > 0) || files.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-2">
              {/* Existing attachments */}
              {isEditing &&
                filteredAttachments.map((attachment) => (
                  <FilePreview
                    key={`existing-${attachment.id}`}
                    fileName={attachment.originalName}
                    isImage={attachment.isImage}
                    onRemove={() => removeExistingAttachment(attachment.id)}
                  />
                ))}

              {/* New file attachments */}
              {files.map((file, index) => (
                <FilePreview
                  key={`new-${file.name}-${index}`}
                  fileName={file.name}
                  isImage={file.type.includes('image')}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          {/* Error messages */}
          {fileErrors && <p className="mt-1 text-xs text-red-600">{fileErrors}</p>}

          {/* Action Buttons and File Input */}
          <div
            className={`flex items-start justify-between transition-opacity duration-200 ${
              isFocused || value.trim().length > 0 ? 'opacity-100' : 'h-0 overflow-hidden opacity-0'
            }`}
          >
            {/* File input button - unchanged */}
            <div className="flex items-center gap-2">
              <MainButton
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={existingAttachments.length - attachmentsToRemove.length + files.length >= MAX_COMMENT_FILES}
                className={`!px-2 ${files.length >= MAX_COMMENT_FILES ? 'bg-gray-100' : 'cursor-pointer bg-white'}`}
                leftIcon={<ImagePlus size={16} className="text-primary" />}
                size="sm"
              >
                Add Files
              </MainButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Cancel button when editing */}
              {isEditing && onCancel && (
                <MainButton type="button" variant="outline" onClick={onCancel} size="sm">
                  Cancel
                </MainButton>
              )}

              <MainButton
                type="submit"
                variant="primary"
                isLoading={isPending}
                disabled={isPending || !value.trim()}
                size="sm"
              >
                {getActionText()}
              </MainButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
