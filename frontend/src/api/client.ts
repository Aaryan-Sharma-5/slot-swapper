import axios from 'axios';
import type {
  AuthResponse,
  User,
  Event,
  SwappableSlot,
  SwapRequest,
  CreateEventData,
  UpdateEventStatusData,
  CreateSwapRequestData,
  SwapResponseData,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/signup', { name, email, password });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data;
  },
};

// Event APIs
export const eventAPI = {
  getMyEvents: async (): Promise<{ events: Event[] }> => {
    const { data } = await api.get<{ events: Event[] }>('/events');
    return data;
  },

  createEvent: async (eventData: CreateEventData): Promise<{ event: Event }> => {
    const { data } = await api.post<{ event: Event }>('/events', eventData);
    return data;
  },

  updateEventStatus: async (
    eventId: number,
    statusData: UpdateEventStatusData
  ): Promise<{ event: Event }> => {
    const { data } = await api.patch<{ event: Event }>(`/events/${eventId}/status`, statusData);
    return data;
  },

  deleteEvent: async (eventId: number): Promise<void> => {
    await api.delete(`/events/${eventId}`);
  },
};

// Swap APIs
export const swapAPI = {
  getSwappableSlots: async (): Promise<{ slots: SwappableSlot[] }> => {
    const { data } = await api.get<{ slots: SwappableSlot[] }>('/swappable-slots');
    return data;
  },

  createSwapRequest: async (requestData: CreateSwapRequestData): Promise<unknown> => {
    const { data } = await api.post<unknown>('/swap-request', requestData);
    return data;
  },

  respondToSwapRequest: async (
    requestId: number,
    responseData: SwapResponseData
  ): Promise<unknown> => {
    const { data } = await api.post<unknown>(`/swap-response/${requestId}`, responseData);
    return data;
  },

  getMySwapRequests: async (): Promise<{ incoming: SwapRequest[]; outgoing: SwapRequest[] }> => {
    const { data } = await api.get<{ incoming: SwapRequest[]; outgoing: SwapRequest[] }>(
      '/my-requests'
    );
    return data;
  },
};

export default api;
