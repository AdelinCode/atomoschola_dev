// API Configuration
const API_BASE_URL = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token in localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Get user from localStorage
const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Set user in localStorage
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

// Remove user from localStorage
const removeUser = () => localStorage.removeItem('user');

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
const authAPI = {
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.success) {
      setToken(data.data.token);
      setUser(data.data);
    }
    
    return data;
  },

  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.success) {
      setToken(data.data.token);
      setUser(data.data);
    }
    
    return data;
  },

  logout: () => {
    removeToken();
    removeUser();
    window.location.href = '/';
  }
};

// Subjects API
const subjectsAPI = {
  getAll: () => apiRequest('/subjects'),
  getBySlug: (slug) => apiRequest(`/subjects/${slug}`),
  create: (subjectData) => apiRequest('/subjects', {
    method: 'POST',
    body: JSON.stringify(subjectData)
  }),
  update: (id, subjectData) => apiRequest(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(subjectData)
  }),
  delete: (id) => apiRequest(`/subjects/${id}`, { method: 'DELETE' })
};

// Lessons API
const lessonsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/lessons?${params}`);
  },
  getById: (id) => apiRequest(`/lessons/${id}`),
  create: (lessonData) => apiRequest('/lessons', {
    method: 'POST',
    body: JSON.stringify(lessonData)
  }),
  update: (id, lessonData) => apiRequest(`/lessons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(lessonData)
  }),
  delete: (id) => apiRequest(`/lessons/${id}`, { method: 'DELETE' }),
  rate: (id, rating) => apiRequest(`/lessons/${id}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating })
  }),
  updateStatus: (id, status) => apiRequest(`/lessons/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
};

// Users API
const usersAPI = {
  getProfile: () => apiRequest('/users/me'),
  updateProfile: (userData) => apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  bookmarkLesson: (lessonId) => apiRequest(`/users/me/bookmark/${lessonId}`, {
    method: 'POST'
  }),
  removeBookmark: (lessonId) => apiRequest(`/users/me/bookmark/${lessonId}`, {
    method: 'DELETE'
  })
};

// Invite Codes API
const inviteCodesAPI = {
  getAll: () => apiRequest('/invite-codes'),
  create: (codeData) => apiRequest('/invite-codes', {
    method: 'POST',
    body: JSON.stringify(codeData)
  }),
  validate: (code) => apiRequest('/invite-codes/validate', {
    method: 'POST',
    body: JSON.stringify({ code })
  }),
  delete: (id) => apiRequest(`/invite-codes/${id}`, { method: 'DELETE' })
};

// Admin API
const adminAPI = {
  getContent: () => apiRequest('/admin/content'),
  deleteSubject: (id) => apiRequest(`/admin/subject/${id}`, { method: 'DELETE' }),
  deleteDomain: (id) => apiRequest(`/admin/domain/${id}`, { method: 'DELETE' }),
  deleteCategory: (id) => apiRequest(`/admin/category/${id}`, { method: 'DELETE' }),
  deleteLesson: (id) => apiRequest(`/admin/lesson/${id}`, { method: 'DELETE' })
};

// Stats API
const statsAPI = {
  getStats: () => apiRequest('/stats')
};

// Export API
window.API = {
  auth: authAPI,
  subjects: subjectsAPI,
  lessons: lessonsAPI,
  users: usersAPI,
  inviteCodes: inviteCodesAPI,
  admin: adminAPI,
  stats: statsAPI,
  getToken,
  getUser,
  isAuthenticated: () => !!getToken(),
  clearCache: () => apiCache.clear()
};
