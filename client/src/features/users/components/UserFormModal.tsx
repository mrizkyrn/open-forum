import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { adminApi } from '@/features/admin/services';
import { User, UserRole } from '@/features/users/types';
import { ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import Modal from '@/shared/components/modals/Modal/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserFormModal = ({ isOpen, onClose, user }: UserFormModalProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: UserRole.STUDENT,
  });
  
  const queryClient = useQueryClient();
  const isEditMode = !!user;


  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        fullName: user.fullName,
        password: '',
        confirmPassword: '',
        role: user.role,
      });
    } else {
      setFormData({
        username: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        role: UserRole.STUDENT,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          fieldErrors[err.path] = err.message;
        });
        setErrors(fieldErrors);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          fieldErrors[err.path] = err.message;
        });
        setErrors(fieldErrors);
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Only validate password for new users or if password field is filled
    if (!isEditMode || formData.password) {
      if (!formData.password.trim() && !isEditMode) {
        newErrors.password = 'Password is required';
      } else if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (formData.password && !formData.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/)) {
        newErrors.password = 'Password must include upper and lowercase letters and numbers';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isEditMode && user) {
      const updateData: any = {
        fullName: formData.fullName,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      updateMutation.mutate({ id: user.id, data: updateData });
    } else {
      createMutation.mutate({
        username: formData.username,
        fullName: formData.fullName,
        password: formData.password,
        role: formData.role,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title={isEditMode ? 'Edit User' : 'Create New User'} onClose={onClose} />

      <ModalBody>
        <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username/NIM
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isEditMode}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Full Name field */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>

          {/* Role field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            >
              <option value={UserRole.STUDENT}>Student</option>
              <option value={UserRole.LECTURER}>Lecturer</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <MainButton type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose} disabled={isPending}>
          Cancel
        </MainButton>
        <MainButton
          type="submit"
          form="userForm"
          className="w-full sm:w-auto"
          disabled={isPending}
          variant="primary"
          isLoading={isPending}
          leftIcon={isEditMode ? <Loader2 size={16} /> : <UserCheck size={16} />}
        >
          {isEditMode ? 'Update User' : 'Create User'}
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default UserFormModal;
