import type {
  Habit,
  HabitLog,
  CreateHabitRequest,
  UpdateHabitRequest,
  CompleteHabitRequest,
  SkipHabitRequest,
  DaemonStatus,
  ApiResponse,
  AppSettings,
  CalendarDay,
  GraphDataPoint,
} from '@habit-tracker/shared';

const API_BASE_URL = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  return data;
}

export const habitsApi = {
  async getAll(): Promise<ApiResponse<Habit[]>> {
    return fetchApi<Habit[]>('/habits');
  },

  async getById(id: string): Promise<ApiResponse<Habit>> {
    return fetchApi<Habit>(`/habits/${id}`);
  },

  async create(data: CreateHabitRequest): Promise<ApiResponse<Habit>> {
    return fetchApi<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateHabitRequest): Promise<ApiResponse<Habit>> {
    return fetchApi<Habit>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/habits/${id}`, {
      method: 'DELETE',
    });
  },

  async complete(id: string, data: CompleteHabitRequest): Promise<ApiResponse<HabitLog>> {
    return fetchApi<HabitLog>(`/habits/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async skip(id: string, data: SkipHabitRequest): Promise<ApiResponse<HabitLog>> {
    return fetchApi<HabitLog>(`/habits/${id}/skip`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getLogs(id: string): Promise<ApiResponse<HabitLog[]>> {
    return fetchApi<HabitLog[]>(`/habits/${id}/logs`);
  },

  async getCalendar(id: string, start?: string, end?: string): Promise<ApiResponse<CalendarDay[]>> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<CalendarDay[]>(`/habits/${id}/calendar${query}`);
  },

  async getGraph(id: string, start?: string, end?: string): Promise<ApiResponse<{ unit?: string; points: GraphDataPoint[] }>> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ unit?: string; points: GraphDataPoint[] }>(`/habits/${id}/graph${query}`);
  },
};

export const settingsApi = {
  async get(): Promise<ApiResponse<AppSettings>> {
    return fetchApi<AppSettings>('/settings');
  },

  async update(data: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
    return fetchApi<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async addBlockedWebsite(website: string): Promise<ApiResponse<{ blockedWebsites: string[] }>> {
    return fetchApi<{ blockedWebsites: string[] }>('/settings/blocked-websites', {
      method: 'POST',
      body: JSON.stringify({ website }),
    });
  },

  async removeBlockedWebsite(website: string): Promise<ApiResponse<{ blockedWebsites: string[] }>> {
    return fetchApi<{ blockedWebsites: string[] }>('/settings/blocked-websites', {
      method: 'DELETE',
      body: JSON.stringify({ website }),
    });
  },
};

export const statusApi = {
  async getStatus(): Promise<ApiResponse<DaemonStatus>> {
    return fetchApi<DaemonStatus>('/status');
  },

  async triggerSync(): Promise<ApiResponse<void>> {
    return fetchApi<void>('/daemon/sync', {
      method: 'POST',
    });
  },
};
