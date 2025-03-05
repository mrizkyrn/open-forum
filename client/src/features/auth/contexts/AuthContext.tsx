import { createContext } from 'react';
import { AuthContextType } from '@/features/auth/types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
