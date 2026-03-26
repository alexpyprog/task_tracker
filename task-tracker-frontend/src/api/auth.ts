import { axiosInstance } from './client';
import { UserLogin, TokenPair, UserCreate, UserOut } from '../types/auth';

export const authApi = {
  async register(data: UserCreate): Promise<UserOut> {
    const response = await axiosInstance.post<UserOut>('/register', data);
    return response.data;
  },

  async login(data: UserLogin): Promise<TokenPair> {
    const response = await axiosInstance.post<TokenPair>('/login', data);
    
    if (response.data.access_token && response.data.refresh_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  },

  async refreshToken(refresh_token: string): Promise<TokenPair> {
    const response = await axiosInstance.post<TokenPair>('/refresh', {
      refresh_token,
    });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async verifyPassword(password: string): Promise<{ verified: boolean }> {
    const response = await axiosInstance.post<{ verified: boolean }>('/verify-password', { password });
    return response.data;
  },

  async sendVerification(email: string): Promise<{ message: string; email: string }> {
    const response = await axiosInstance.post('/send-verification', { email });
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ verified: boolean; message: string }> {
    const response = await axiosInstance.post('/verify-email', { token });
    return response.data;
  },
};