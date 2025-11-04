export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
  createdAt?: string;
}

export interface SwappableSlot {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  userId: number;
  userName: string;
}

export interface SwapRequest {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  mySlot: {
    id: number;
    title: string;
    startTime: string;
    endTime: string;
  };
  theirSlot: {
    id: number;
    title: string;
    startTime: string;
    endTime: string;
  };
  requester?: {
    id: number;
    name: string;
  };
  receiver?: {
    id: number;
    name: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateEventData {
  title: string;
  startTime: string;
  endTime: string;
}

export interface UpdateEventStatusData {
  status: 'BUSY' | 'SWAPPABLE';
}

export interface CreateSwapRequestData {
  mySlotId: number;
  theirSlotId: number;
}

export interface SwapResponseData {
  accept: boolean;
}
