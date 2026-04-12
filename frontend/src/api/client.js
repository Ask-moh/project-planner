const BASE_URL = '/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('email');
  window.location.href = '/login';
}

async function request(path, options = {}, isRetry = false) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    let res = await fetch(`${BASE_URL}${path}`, {
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers 
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized
    if (res.status === 401 && !isRetry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('token', data.access);
            if (data.refresh) {
              localStorage.setItem('refreshToken', data.refresh);
            }
            // Retry the original request
            return request(path, options, true);
          } else {
            logout();
          }
        } catch (err) {
          logout();
        }
      } else {
        logout();
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || error.detail || `Request failed (${res.status})`);
    }

    // Handle empty responses (e.g. 204 No Content)
    if (res.status === 204) return {};
    const text = await res.text();
    return text ? JSON.parse(text) : {};

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  }
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: data }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: data }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (projectId) => request(`/tasks${projectId ? `?projectId=${projectId}` : ''}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: data }),
  patchTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: data }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markAllNotificationsRead: () => request('/notifications/mark-read', { method: 'POST' }),
  markNotificationRead: (id) => request(`/notifications/${id}`, { method: 'PATCH', body: { is_read: true } }),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),
  getWorkspaceAnalytics: () => request('/analytics/workspace'),

  // AI
  generatePlan: (data) => request('/ai/plan', { method: 'POST', body: data }),
  savePlan: (data) => request('/ai/save-plan', { method: 'POST', body: data }),
};
