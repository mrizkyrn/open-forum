import { useState, useRef, useEffect } from 'react';
import { X, FileText, Image, Loader2, ImagePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import { toast } from 'react-toastify';
import { ALLOWED_FILE_TYPES, MAX_COMMENT_FILES, MAX_FILE_SIZE } from '@/constants/fileConstants';
import { Attachment } from '@/types/AttachmentTypes';

interface CommentFormProps {
  discussionId: number;
  isReply?: boolean;
  parentId?: number | null;
  onClickOutside?: () => void;
  initialFocus?: boolean;
  onSuccess?: () => void;
  isEditing?: boolean;
  commentId?: number;
  initialValue?: string;
  existingAttachments?: Attachment[];
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
  // File handling state
  const [value, onChange] = useState(initialValue);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const commentFormRef = useRef<HTMLFormElement>(null);

  // Auto-resize functionality for textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Set local ref from forwarded ref
  useEffect(() => {
    onChange(initialValue);
    // Also trigger textarea resize
    setTimeout(adjustTextareaHeight, 0);
  }, [initialValue]);

  // Focus and resize on mount for editing
  useEffect(() => {
    if (initialFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        // Place cursor at end of text
        const length = initialValue.length;
        textareaRef.current?.setSelectionRange(length, length);

        // Resize textarea to fit content
        adjustTextareaHeight();
      }, 50);
    }
  }, [initialFocus, initialValue]);

  // Auto-height adjustment for textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle clicks outside the form to remove focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commentFormRef.current && !commentFormRef.current.contains(event.target as Node)) {
        setIsFocused(false);

        // Call onClickOutside prop if provided and there's no content
        if (onClickOutside && !value.trim()) {
          onClickOutside();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside, value]);

  // Comment mutation
  const { mutate: submitComment, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing && commentId) {
        // For editing, include the attachmentsToRemove array
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
      // Invalidate the appropriate queries
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });

      // If editing a reply, also invalidate the parent's replies
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', parentId] });
      }

      onChange('');
      setFiles([]);
      setAttachmentsToRemove([]);

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

  // File validation
  const validateFiles = (filesToCheck: File[]): boolean => {
    if (filesToCheck.length > MAX_COMMENT_FILES) {
      setFileErrors(`Maximum ${MAX_COMMENT_FILES} files allowed`);
      return false;
    }

    for (const file of filesToCheck) {
      if (file.size > MAX_FILE_SIZE) {
        setFileErrors(`${file.name} is too large (max 5MB)`);
        return false;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileErrors(`${file.name} has an unsupported file type`);
        return false;
      }
    }

    setFileErrors(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (validateFiles([...files, ...selectedFiles])) {
      if (files.length + selectedFiles.length <= MAX_COMMENT_FILES) {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    }

    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToRemove((prev) => [...prev, attachmentId]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileErrors(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      const formData = new FormData();
      formData.append('content', value.trim());

      if (parentId) {
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
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            adjustTextareaHeight();
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={isReply ? `Write a reply...` : 'Write a comment...'}
          className={`focus:ring-primary-lighter min-h-[36px] w-full resize-none overflow-hidden rounded-md border border-gray-300 px-3 py-2 transition-all focus:ring-1 focus:outline-none ${
            isReply ? 'text-sm' : ''
          }`}
          rows={1}
        />

        {/* Show existing attachments that haven't been marked for removal */}
        {isEditing && existingAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {existingAttachments
              .filter((attachment) => !attachmentsToRemove.includes(attachment.id))
              .map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  {attachment.isImage ? (
                    <Image size={16} className="text-blue-500" />
                  ) : (
                    <FileText size={16} className="text-orange-500" />
                  )}
                  <span className="max-w-[100px] truncate text-xs">{attachment.originalName}</span>
                  <button
                    type="button"
                    onClick={() => removeExistingAttachment(attachment.id)}
                    className="rounded-full text-gray-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* File attachment previews - always show if files exist */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
              >
                {file.type.startsWith('image/') ? (
                  <Image size={16} className="text-blue-500" />
                ) : (
                  <FileText size={16} className="text-orange-500" />
                )}
                <span className="max-w-[100px] truncate text-xs">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="rounded-full text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error messages - always show if there are errors */}
        {fileErrors && <p className="mt-1 text-xs text-red-600">{fileErrors}</p>}

        {/* File input and submit/cancel buttons */}
        <div
          className={`flex items-center justify-between transition-opacity duration-200 ${
            isFocused || value.trim().length > 0 ? 'opacity-100' : 'h-0 overflow-hidden opacity-0'
          }`}
        >
          <div className="flex items-center gap-2">{/* File input button - unchanged */}</div>

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
              className={`bg-primary hover:bg-primary-dark flex items-center gap-1 rounded-md text-white disabled:bg-gray-400 ${
                isReply || isEditing ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
              }`}
            >
              {isPending ? <Loader2 size={isReply || isEditing ? 12 : 14} className="animate-spin" /> : null}
              {getActionText()}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

CommentForm.displayName = 'CommentForm';

export default CommentForm;
