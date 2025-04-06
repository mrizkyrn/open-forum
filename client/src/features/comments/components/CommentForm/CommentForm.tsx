import UserAvatar from '@/components/layouts/UserAvatar';
import MainButton from '@/components/ui/buttons/MainButton';
import FilePreview from '@/components/ui/file-displays/FilePreview';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { commentApi } from '@/features/comments/services';
import { useFileHandling } from '@/hooks/useFileHandling';
import { Attachment } from '@/types/AttachmentTypes';
import { ALLOWED_FILE_TYPES, MAX_COMMENT_FILES, MAX_FILE_SIZE } from '@/utils/constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface CommentFormProps {
  discussionId: number;
  commentId?: number;
  parentId?: number | null;
  isReply?: boolean;
  isEditing?: boolean;
  initialFocus?: boolean;
  initialValue?: string;
  existingAttachments?: Attachment[];
  onClickOutside?: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  discussionId,
  isReply = false,
  parentId,
  onClickOutside,
  initialFocus = false,
  onSuccess,
  isEditing = false,
  commentId,
  initialValue = '',
  existingAttachments = [],
  onCancel,
}) => {
  const [value, onChange] = useState(initialValue);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<number[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const { files, fileErrors, fileInputRef, handleFileChange, removeFile, clearFiles } = useFileHandling(
    MAX_COMMENT_FILES,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
  );

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Set initial value and adjust textarea height
  useEffect(() => {
    onChange(initialValue);
    setTimeout(adjustTextareaHeight, 0);
  }, [initialValue]);

  // Focus and resize on mount for editing
  useEffect(() => {
    if (initialFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();

        const length = initialValue.length;
        textareaRef.current?.setSelectionRange(length, length);

        adjustTextareaHeight();
      }, 50);
    }
  }, [initialFocus, initialValue]);

  // Handle clicks outside the form to remove focus
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
    mutationFn: async (data: FormData) => {
      if (isEditing && commentId) {
        if (attachmentsToRemove.length > 0) {
          attachmentsToRemove.forEach((attachmentId) => {
            data.append('attachmentsToRemove', attachmentId.toString());
          });
        }
        return await commentApi.updateComment(commentId, data);
      } else {
        return await commentApi.createComment(discussionId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'], exact: false });

      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', parentId] });
      }

      onChange('');
      clearFiles();
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

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToRemove((prev) => [...prev, attachmentId]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      const formData = new FormData();
      formData.append('content', value.trim());

      if (parentId && !isEditing) {
        formData.append('parentId', parentId.toString());
      }

      files.forEach((file) => {
        formData.append('files', file);
      });

      submitComment(formData);
    }
  };

  const getActionText = () => {
    if (isEditing) return 'Save Changes';
    if (isReply) return `Reply`;
    return 'Post Comment';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-white">
      <div className="flex items-start gap-2">
        {isReply || isEditing ? null : <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="md" />}
        <div className="flex w-full flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              adjustTextareaHeight();
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={isReply ? `Write a reply...` : 'Write a comment...'}
            className={`focus:ring-primary-lighter w-full resize-none overflow-hidden rounded-md border border-gray-300 px-3 py-1 transition-all focus:ring-1 focus:outline-none ${
              isReply ? 'min-h-[30px] text-sm' : 'min-h-[38px]'
            }`}
            rows={1}
          />

          {/* Show existing attachments that haven't been marked for removal */}
          {isEditing && existingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {existingAttachments
                .filter((attachment) => !attachmentsToRemove.includes(attachment.id))
                .map((attachment) => (
                  <FilePreview
                    key={attachment.id}
                    fileName={attachment.originalName}
                    isImage={attachment.isImage}
                    onRemove={() => removeExistingAttachment(attachment.id)}
                  />
                ))}
            </div>
          )}

          {/* File attachment previews - always show if files exist */}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <FilePreview
                  key={file.name}
                  fileName={file.name}
                  isImage={file.type.includes('image')}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          {/* Error messages - always show if there are errors */}
          {fileErrors && <p className="mt-1 text-xs text-red-600">{fileErrors}</p>}

          {/* File input and submit/cancel buttons */}
          <div
            className={`flex items-start justify-between transition-opacity duration-200 ${
              isFocused || value.trim().length > 0 ? 'opacity-100' : 'h-0 overflow-hidden opacity-0'
            }`}
          >
            {/* File input button - unchanged */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_COMMENT_FILES}
                className={`flex rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 ${
                  files.length >= MAX_COMMENT_FILES ? 'bg-gray-100' : 'cursor-pointer bg-white'
                }`}
              >
                <ImagePlus size={16} className="text-primary mr-2" />
                <p className="text-xs text-gray-500">Add Files</p>
              </button>
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
              {/* Add Cancel button when editing */}
              {isEditing && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}

              <MainButton
                type="submit"
                variant="primary"
                isLoading={isPending}
                disabled={isPending || !value.trim()}
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

CommentForm.displayName = 'CommentForm';

export default CommentForm;
