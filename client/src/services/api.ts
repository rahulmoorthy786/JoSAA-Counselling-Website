import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        // Add user information to headers for authentication
        config.headers['x-user-id'] = userData.userID;
        config.headers['x-user-role'] = userData.role;
        if (userData.candidateID) {
          config.headers['x-candidate-id'] = userData.candidateID;
        }
        if (userData.instituteCode) {
          config.headers['x-institute-code'] = userData.instituteCode;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (identifier: string, password: string) =>
    api.post('/auth/login', { identifier, password }),
  register: (role: string, userData: any) =>
    api.post('/auth/register', { role, ...userData }),
  logout: () => api.post('/auth/logout'),
  getProfile: (userID: number) => api.get(`/auth/profile/${userID}`),
  updateProfile: (userID: number, updates: any) =>
    api.put(`/auth/profile/${userID}`, updates),
  changePassword: (userID: number, currentPassword: string, newPassword: string) =>
    api.put(`/auth/password/${userID}`, { currentPassword, newPassword }),
  checkIdentifier: (type: string, value: string) =>
    api.get(`/auth/check?type=${type}&value=${value}`),
  getAllUsers: () => api.get('/auth/users'),
  deleteUser: (userId: number) => api.delete(`/auth/users/${userId}`),
};

// Helper functions for authentication
export const login = async (identifier: string, password: string) => {
  const response = await authAPI.login(identifier, password);
  return response.data;
};

export const register = async (role: string, userData: any) => {
  const response = await authAPI.register(role, { ...userData, password: userData.password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  return authAPI.logout();
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Candidate APIs
export const candidateAPI = {
  getAll: () => api.get('/candidates'),
  getById: (id: number) => api.get(`/candidates/${id}`),
  getWithAllocation: (id: number) => api.get(`/candidates/${id}/allocation`),
  create: (data: any) => api.post('/candidates', data),
  update: (id: number, data: any) => api.put(`/candidates/${id}`, data),
  delete: (id: number) => api.delete(`/candidates/${id}`),
};

// Institute APIs
export const instituteAPI = {
  getAll: () => api.get('/institutes'),
  getByCode: (code: string) => api.get(`/institutes/${code}`),
  getWithPrograms: () => api.get('/institutes/with-programs/all'),
  getProgramsByInstitute: (code: string) => api.get(`/institutes/${code}/programs`),
  getAllocatedStudents: (code: string) => api.get(`/institutes/${code}/allocated-students`),
  getApplicants: (code: string) => api.get(`/institutes/${code}/applicants`),
  create: (data: any) => api.post('/institutes', data),
  update: (code: string, data: any) => api.put(`/institutes/${code}`, data),
  delete: (code: string) => api.delete(`/institutes/${code}`),
};

// Choice List APIs
export const choiceAPI = {
  getByCandidate: (candidateId: number) => api.get(`/choices/candidate/${candidateId}`),
  add: (data: any) => api.post('/choices', data),
  updateOrder: (choiceId: number, newChoiceNumber: number) =>
    api.put(`/choices/${choiceId}/order`, { newChoiceNumber }),
  reorder: (candidateId: number, choices: any[]) =>
    api.post('/choices/reorder', { candidateId, choices }),
  lock: (candidateId: number, lockStatus: boolean) =>
    api.post('/choices/lock', { candidateId, lockStatus }),
  delete: (choiceId: number) => api.delete(`/choices/${choiceId}`),
  deleteAll: (candidateId: number) => api.delete(`/choices/candidate/${candidateId}/all`),
  // Admin-only endpoints
  getAllCandidatesWithChoices: () => api.get('/choices/admin/all-candidates'),
  getCandidateChoicesForAdmin: (candidateId: number) => api.get(`/choices/admin/candidate/${candidateId}`),
};

// Allocation APIs
export const allocationAPI = {
  getAll: () => api.get('/allocations'),
  getByCandidate: (candidateId: number) => api.get(`/allocations/candidate/${candidateId}`),
  getByRound: (roundId: number) => api.get(`/allocations/round/${roundId}`),
  create: (data: any) => api.post('/allocations', data),
  update: (allocationId: number, data: any) => api.put(`/allocations/${allocationId}`, data),
  updateFeeStatus: (allocationId: number, status: string) =>
    api.put(`/allocations/${allocationId}/fee-status`, { status }),
  delete: (allocationId: number) => api.delete(`/allocations/${allocationId}`),
};

// Program APIs
export const programAPI = {
  getAll: () => api.get('/programs'),
  getByCode: (code: string) => api.get(`/programs/${code}`),
  create: (data: any) => api.post('/programs', data),
  delete: (code: string) => api.delete(`/programs/${code}`),
};

// Seat Matrix APIs
export const seatMatrixAPI = {
  getAll: () => api.get('/seat-matrix'),
  getByInstitute: (instituteCode: string) => api.get(`/seat-matrix/institute/${instituteCode}`),
  create: (data: any) => api.post('/seat-matrix', data),
  update: (instituteCode: string, programCode: string, data: any) =>
    api.put(`/seat-matrix/${instituteCode}/${programCode}`, data),
  delete: (instituteCode: string, programCode: string, data: any) =>
    api.delete(`/seat-matrix/${instituteCode}/${programCode}`, { data }),
};

// Opening Closing Ranks APIs
export const ranksAPI = {
  getAll: () => api.get('/opening-closing-ranks'),
  getByRound: (roundId: number) => api.get(`/opening-closing-ranks/round/${roundId}`),
  searchByRank: (rank: number, category: string) =>
    api.get(`/opening-closing-ranks/search?rank=${rank}&category=${category}`),
  create: (data: any) => api.post('/opening-closing-ranks', data),
  update: (ocrId: number, data: any) => api.put(`/opening-closing-ranks/${ocrId}`, data),
  delete: (ocrId: number) => api.delete(`/opening-closing-ranks/${ocrId}`),
};

// Counselling Round APIs
export const counsellingRoundAPI = {
  getAll: () => api.get('/counselling-rounds'),
  getCurrent: () => api.get('/counselling-rounds/current'),
  create: (data: any) => api.post('/counselling-rounds', data),
};

export default api;
