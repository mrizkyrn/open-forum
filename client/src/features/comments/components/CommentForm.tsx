import { forwardRef } from 'react';

interface CommentFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  isCompact?: boolean;
}

const CommentForm = forwardRef<HTMLTextAreaElement, CommentFormProps>(
  ({ value, onChange, onSubmit, isSubmitting = false, isEditing = false, isCompact = false }, ref) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && !isSubmitting) {
        onSubmit();
      }
    };

    const getActionText = () => {
      if (isEditing) return 'Save Changes';
      if (isCompact) return `Reply`;
      return 'Post Comment';
    };

    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 rounded-lg bg-white`}>
        <div className="flex w-full gap-2">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isCompact ? `Write a reply...` : 'Write a comment...'}
            className={`focus:ring-primary-lighter w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none ${
              isCompact ? 'text-sm' : ''
            }`}
            rows={isCompact ? 1 : 2}
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className={`bg-primary hover:bg-primary-dark flex items-center gap-1 rounded-md text-white disabled:bg-gray-500 ${
            isCompact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          {getActionText()}
        </button>
      </form>
    );
  },
);

CommentForm.displayName = 'CommentForm';

export default CommentForm;
