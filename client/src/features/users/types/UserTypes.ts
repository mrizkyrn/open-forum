export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  LECTURER = 'lecturer',
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
