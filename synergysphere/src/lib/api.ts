import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Types
export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  deadline?: string;
  status: 'active' | 'archived' | 'completed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  managerId: string;
  members: User[];
};

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assigneeId?: string;
  project: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  taskId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
};

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, any>;
};

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 10000, // 10 seconds
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(handleApiError(error))
  );

  // Response interceptor to handle errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If the error is 401 and we haven't already tried to refresh the token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { data } = await authApi.refreshToken();
          const { token } = data;
          
          localStorage.setItem('token', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          return api(originalRequest);
        } catch (error) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(handleApiError(error));
        }
      }
      
      return Promise.reject(handleApiError(error));
    }
  );

  return api;
};

// Helper function to handle API errors
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const serverError = error as AxiosError<{ message?: string }>;
    return new Error(
      serverError.response?.data?.message || 
      serverError.message || 
      'An unexpected error occurred'
    );
  }
  return error instanceof Error ? error : new Error('An unknown error occurred');
};

const api = createApiClient();

// API methods
export const authApi = {
  // Authentication
  login: (email: string, password: string) => 
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
    
  register: (name: string, email: string, password: string) => 
    api.post<{ token: string; user: User }>('/auth/register', { name, email, password }),
    
  refreshToken: () => 
    api.post<{ token: string }>('/auth/refresh-token'),
    
  logout: () => 
    api.post('/auth/logout'),
    
  getMe: () => 
    api.get<User>('/auth/me'),
    
  // Password reset
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) => 
    api.post(`/auth/reset-password/${token}`, { password }),
};

export const usersApi = {
  // Get all users (admin only)
  getUsers: (params?: any) => 
    api.get<User[]>('/users', { params }),
    
  // Get user by ID
  getUser: (id: string) => 
    api.get<User>(`/users/${id}`),
    
  // Update user profile
  updateProfile: (data: Partial<User>) => 
    api.put<User>('/users/profile', data),
    
  // Update user password
  updatePassword: (currentPassword: string, newPassword: string) => 
    api.put('/users/password', { currentPassword, newPassword }),
    
  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<{ url: string }>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const projectsApi = {
  // Get all projects
  getProjects: (params?: any) => 
    api.get<Project[]>('/projects', { params }),
    
  // Get project by ID
  getProject: (id: string) => 
    api.get<Project>(`/projects/${id}`),
    
  // Create new project
  createProject: (data: { name: string; description?: string; deadline?: string; tags?: string[] }) => 
    api.post<Project>('/projects', data),
    
  // Update project
  updateProject: (id: string, data: Partial<Project>) => 
    api.put<Project>(`/projects/${id}`, data),
    
  // Delete project
  deleteProject: (id: string) => 
    api.delete<void>(`/projects/${id}`),
    
  // Get project members
  getProjectMembers: (projectId: string) => 
    api.get<User[]>(`/projects/${projectId}/members`),
    
  // Add member to project
  addProjectMember: (projectId: string, email: string) => 
    api.post<{ success: boolean; message: string }>(`/projects/${projectId}/members`, { email }),
    
  // Remove member from project
  removeProjectMember: (projectId: string, userId: string) => 
    api.delete<void>(`/projects/${projectId}/members/${userId}`),
    
  // Update member role
  updateMemberRole: (projectId: string, userId: string, role: string) => 
    api.put<{ success: boolean }>(`/projects/${projectId}/members/${userId}`, { role }),
};

export const tasksApi = {
  // Get all tasks
  getTasks: (params?: any) => 
    api.get<Task[]>('/tasks', { params }),
    
  // Get task by ID
  getTask: (id: string) => 
    api.get<Task>(`/tasks/${id}`),
    
  // Create new task
  createTask: (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    projectId: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
  }) => api.post<Task>('/tasks', data),
    
  // Update task
  updateTask: (id: string, data: Partial<Task>) => 
    api.put<Task>(`/tasks/${id}`, data),
    
  // Delete task
  deleteTask: (id: string) => 
    api.delete<void>(`/tasks/${id}`),
    
  // Update task status
  updateTaskStatus: (id: string, status: TaskStatus) => 
    api.patch<Task>(`/tasks/${id}/status`, { status }),
    
  // Assign task to user
  assignTask: (id: string, userId: string | null) => 
    api.patch<Task>(`/tasks/${id}/assign`, { userId }),
    
  // Get tasks by project
  getTasksByProject: (projectId: string, params?: any) => 
    api.get<Task[]>(`/projects/${projectId}/tasks`, { params }),
    
  // Get tasks assigned to current user
  getMyTasks: (params?: any) => 
    api.get<Task[]>('/tasks/me', { params }),
};

export const commentsApi = {
  // Get comments for a task
  getComments: (taskId: string) => 
    api.get<Comment[]>(`/tasks/${taskId}/comments`),
    
  // Add comment to task
  addComment: (taskId: string, content: string) => 
    api.post<Comment>(`/tasks/${taskId}/comments`, { content }),
    
  // Update comment
  updateComment: (commentId: string, content: string) => 
    api.put<Comment>(`/comments/${commentId}`, { content }),
    
  // Delete comment
  deleteComment: (commentId: string) => 
    api.delete<void>(`/comments/${commentId}`),
};

export const notificationsApi = {
  // Get user notifications
  getNotifications: (params?: any) => 
    api.get<Notification[]>('/notifications', { params }),
    
  // Mark notification as read
  markAsRead: (id: string) => 
    api.patch<Notification>(`/notifications/${id}/read`),
    
  // Mark all notifications as read
  markAllAsRead: () => 
    api.patch<{ count: number }>('/notifications/read-all'),
};

export const filesApi = {
  // Upload file
  uploadFile: (file: File, folder: string = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return api.post<{ url: string; key: string }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete file
  deleteFile: (id: string) => 
    api.delete<void>(`/files/${id}`),
    
  // Get file by ID
  getFile: (id: string) => 
    api.get<Blob>(`/files/${id}`, { responseType: 'blob' }),
};

// Export the axios instance for custom requests
export default api;
