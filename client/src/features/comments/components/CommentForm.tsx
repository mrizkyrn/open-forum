import { useState, useRef, useEffect } from 'react';
import { Loader2, ImagePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import { toast } from 'react-toastify';
import { ALLOWED_FILE_TYPES, MAX_COMMENT_FILES, MAX_FILE_SIZE } from '@/constants/fileConstants';
import { Attachment } from '@/types/AttachmentTypes';
import AvatarImage from '@/features/users/components/AvatarImage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import FilePreview from '@/components/ui/FilePreview';
import { useFileHandling } from '@/features/discussions/hooks/useFileHandling';

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
  const commentFormRef = useRef<HTMLFormElement>(null);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (commentFormRef.current && !commentFormRef.current.contains(event.target as Node)) {
        setIsFocused(false);

        if (onClickOutside && !value.trim()) {
          onClickOutside();
        }
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

  // const validateFiles = (filesToCheck: File[]): boolean => {
  //   if (filesToCheck.length > MAX_COMMENT_FILES) {
  //     setFileErrors(`Maximum ${MAX_COMMENT_FILES} files allowed`);
  //     return false;
  //   }

  //   for (const file of filesToCheck) {
  //     if (file.size > MAX_FILE_SIZE) {
  //       setFileErrors(`${file.name} is too large (max 5MB)`);
  //       return false;
  //     }

  //     if (!ALLOWED_FILE_TYPES.includes(file.type)) {
  //       setFileErrors(`${file.name} has an unsupported file type`);
  //       return false;
  //     }
  //   }

  //   setFileErrors(null);
  //   return true;
  // };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFiles = Array.from(e.target.files || []);

  //   if (validateFiles([...files, ...selectedFiles])) {
  //     if (files.length + selectedFiles.length <= MAX_COMMENT_FILES) {
  //       setFiles((prev) => [...prev, ...selectedFiles]);
  //     }
  //   }

  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToRemove((prev) => [...prev, attachmentId]);
  };

  // const removeFile = (index: number) => {
  //   setFiles((prev) => prev.filter((_, i) => i !== index));
  //   setFileErrors(null);
  // };

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
    <div className="w-full">
      <form ref={commentFormRef} onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-white">
        <div className="flex items-start gap-2">
          {isReply || isEditing ? null : <AvatarImage fullName={user?.fullName} size="10" />}
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

                <button
                  type="submit"
                  disabled={!value.trim() || isPending}
                  className={`bg-primary hover:bg-primary-dark flex items-center gap-1 rounded-md py-2 text-white disabled:bg-gray-400 ${
                    isReply || isEditing ? 'px-3 text-xs' : 'px-4 text-sm'
                  }`}
                >
                  {isPending ? <Loader2 size={isReply || isEditing ? 12 : 14} className="animate-spin" /> : null}
                  {getActionText()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

CommentForm.displayName = 'CommentForm';

export default CommentForm;
