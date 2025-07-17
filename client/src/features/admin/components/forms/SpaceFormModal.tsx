import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { adminApi } from '@/features/admin/services';
import { CreateSpaceRequest, Space, SpaceType, UpdateSpaceRequest } from '@/features/spaces/types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { getFileUrl } from '@/utils/helpers';

interface SpaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space | null;
}

const SpaceFormModal = ({ isOpen, onClose, space }: SpaceFormModalProps) => {
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSpaceRequest, string>>>({});
  const [formData, setFormData] = useState<CreateSpaceRequest | UpdateSpaceRequest>({
    name: '',
    description: '',
    slug: '',
    spaceType: SpaceType.OTHER,
  });

  const queryClient = useQueryClient();
  const isEditMode = !!space;

  // Reset form when modal opens/closes or space changes
  useEffect(() => {
    if (isOpen) {
      if (space) {
        setFormData({
          name: space.name || '',
          description: space.description || '',
          slug: space.slug || '',
          spaceType: space.spaceType,
        });
        setIconPreview(space.iconUrl ? getFileUrl(space.iconUrl) : null);
        setBannerPreview(space.bannerUrl ? getFileUrl(space.bannerUrl) : null);
      } else {
        setFormData({
          name: '',
          description: '',
          slug: '',
          spaceType: SpaceType.OTHER,
        });
        setIconPreview(null);
        setBannerPreview(null);
      }
      setIconFile(null);
      setBannerFile(null);
      setErrors({});
    }
  }, [isOpen, space]);

  // Create space mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSpaceRequest) => adminApi.createSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Space created successfully');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to create space';
      toast.error(errorMessage);

      // Handle validation errors
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors.reduce(
          (acc: any, curr: any) => ({ ...acc, [curr.path]: curr.message }),
          {},
        );
        setErrors(validationErrors);
      }
    },
  });

  // Update space mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSpaceRequest }) => adminApi.updateSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Space updated successfully');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to update space';
      toast.error(errorMessage);

      // Handle validation errors
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors.reduce(
          (acc: any, curr: any) => ({ ...acc, [curr.path]: curr.message }),
          {},
        );
        setErrors(validationErrors);
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name if in create mode and slug hasn't been manually edited
    if (name === 'name' && !isEditMode && !formData.slug) {
      const slugValue = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, slug: slugValue }));
    }

    // Clear error when field is edited
    if (errors[name as keyof CreateSpaceRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
      if (errors.icon) {
        setErrors((prev) => ({ ...prev, icon: undefined }));
      }
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      if (errors.banner) {
        setErrors((prev) => ({ ...prev, banner: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateSpaceRequest, string>> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.spaceType) {
      newErrors.spaceType = 'Space type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (isEditMode && space) {
      const updateData: UpdateSpaceRequest = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
        spaceType: formData.spaceType,
      };

      // Handle icon
      if (iconFile) {
        updateData.icon = iconFile;
      } else if (space.iconUrl && iconPreview === null) {
        updateData.removeIcon = true;
      }

      // Handle banner
      if (bannerFile) {
        updateData.banner = bannerFile;
      } else if (space.bannerUrl && bannerPreview === null) {
        updateData.removeBanner = true;
      }

      updateMutation.mutate({ id: space.id, data: updateData });
    } else {
      const createData: CreateSpaceRequest = {
        name: formData.name || '',
        description: formData.description || '',
        slug: formData.slug || '',
        spaceType: formData.spaceType as SpaceType,
      };

      if (iconFile) createData.icon = iconFile;
      if (bannerFile) createData.banner = bannerFile;

      createMutation.mutate(createData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title={isEditMode ? `Edit Space: ${space?.name}` : 'Create New Space'} onClose={onClose} />

      <ModalBody>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Space Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                /
              </span>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`block w-full rounded-none rounded-r-md border ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm`}
                placeholder="unique-space-slug"
              />
            </div>
            {errors.slug ? (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">URL-friendly identifier. Used in links to your space.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
              placeholder="Describe what this space is about"
            />
          </div>

          {/* Space Type */}
          <div>
            <label htmlFor="spaceType" className="block text-sm font-medium text-gray-700">
              Space Type <span className="text-red-500">*</span>
            </label>
            <select
              id="spaceType"
              name="spaceType"
              value={formData.spaceType}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.spaceType ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm`}
            >
              <option value={SpaceType.INTEREST}>Interest</option>
              <option value={SpaceType.PROFESSIONAL}>Professional</option>
              <option value={SpaceType.COMMUNITY}>Community</option>
              <option value={SpaceType.ORGANIZATION}>Organization</option>
              <option value={SpaceType.EVENT}>Event</option>
              <option value={SpaceType.SUPPORT}>Support</option>
              <option value={SpaceType.OTHER}>Other</option>
            </select>
            {errors.spaceType && <p className="mt-1 text-sm text-red-600">{errors.spaceType}</p>}
          </div>

          {/* Icon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Space Icon</label>
            <div className="mt-1 flex items-center space-x-4">
              {iconPreview ? (
                <div className="relative h-16 w-16">
                  <img src={iconPreview} alt="Space icon preview" className="h-16 w-16 rounded-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setIconFile(null);
                      setIconPreview(null);
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Image size={24} className="text-gray-400" />
                </div>
              )}

              <label className="flex cursor-pointer items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50">
                <Upload size={16} className="mr-2" />
                {iconPreview ? 'Change Icon' : 'Upload Icon'}
                <input type="file" className="hidden" accept="image/*" onChange={handleIconChange} />
              </label>
            </div>
            {errors.icon && <p className="mt-1 text-sm text-red-600">{errors.icon}</p>}
            <p className="mt-1 text-sm text-gray-500">Recommended: Square image, at least 200x200px</p>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Space Banner</label>
            <div className="mt-1">
              {bannerPreview ? (
                <div className="relative">
                  <img src={bannerPreview} alt="Space banner preview" className="h-32 w-full rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="bg-opacity-50 hover:bg-opacity-70 absolute top-2 right-2 rounded-full bg-gray-800 p-1 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-md bg-gray-100">
                  <label className="flex cursor-pointer flex-col items-center px-3 py-2 text-sm text-gray-500">
                    <Upload size={24} className="mb-2" />
                    <span>Upload Banner Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerChange} />
                  </label>
                </div>
              )}
            </div>
            {errors.banner && <p className="mt-1 text-sm text-red-600">{errors.banner}</p>}
            <p className="mt-1 text-sm text-gray-500">Recommended: 1200x300px, 3:1 ratio</p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <MainButton variant="outline" onClick={onClose} disabled={createMutation.isPending || updateMutation.isPending}>
          Cancel
        </MainButton>
        <MainButton onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditMode ? 'Update Space' : 'Create Space'}
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default SpaceFormModal;
