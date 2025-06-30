import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { userApi } from '@/features/users/services';
import { getFileUrl } from '@/utils/helpers';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  size?: string;
  onSuccess?: () => void;
}

const AvatarUpload = ({ currentAvatarUrl, size = '24', onSuccess }: AvatarUploadProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { updateUser } = useAuth();

  // Upload avatar mutation
  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      updateUser({ avatarUrl: updatedUser.avatarUrl });

      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar updated successfully');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
  });

  // Remove avatar mutation
  const { mutate: removeAvatar, isPending: isRemoving } = useMutation({
    mutationFn: () => userApi.removeAvatar(),
    onSuccess: () => {
      updateUser({ avatarUrl: null });

      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar removed');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove avatar');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast.error('Image must be smaller than 2MB');
      return;
    }

    uploadAvatar(file);
  };

  const isPending = isUploading || isRemoving;

  return (
    <div
      className={`relative h-${size} w-${size} overflow-hidden rounded-full border-4 border-white bg-white`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Current avatar or placeholder */}
      {currentAvatarUrl ? (
        <img src={getFileUrl(currentAvatarUrl)} alt="User avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
          <UserIcon className="h-10 w-10" />
        </div>
      )}

      {/* Upload/Remove overlay */}
      {(isHovering || isPending) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all">
          {isPending ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white p-2 text-gray-700 transition hover:bg-white/90"
                aria-label="Upload new avatar"
              >
                <Camera className="h-4 w-4" />
              </button>

              {currentAvatarUrl && (
                <button
                  type="button"
                  onClick={() => removeAvatar()}
                  className="hover:bg-opacity-90 rounded-full bg-white p-2 text-red-500 transition"
                  aria-label="Remove avatar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default AvatarUpload;
