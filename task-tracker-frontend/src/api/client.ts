import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api'; 

class ApiClient {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_URL}${API_PREFIX}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshPromise) {
            await this.refreshPromise;
            return this.instance(originalRequest);
          }

          originalRequest._retry = true;
          this.refreshPromise = this.refreshToken();

          try {
            const newToken = await this.refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.refreshPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token');
    }

    try {
      const response = await axios.post(`${API_URL}/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      return access_token;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  public logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

export const apiClient = new ApiClient();
export const axiosInstance = apiClient.getInstance();