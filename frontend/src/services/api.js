/**
 * FinPilot AI API Client
 * Interacts with FastAPI backend with automatic Bearer token injection
 */

const BASE_URL = '/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('finpilot_token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Only redirect if we have a stale token and not already on login
    if (localStorage.getItem('finpilot_token')) {
      localStorage.removeItem('finpilot_token');
      localStorage.removeItem('finpilot_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    const errorData = await response.json().catch(() => ({ detail: 'Authentication required' }));
    throw new Error(errorData.detail || 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Auth
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
    register: async (userData) => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return handleResponse(res);
    },
    demoLogin: async () => {
      const res = await fetch(`${BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Dashboard
  dashboard: {
    getSummary: async () => {
      const res = await fetch(`${BASE_URL}/dashboard/summary`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Transactions
  transactions: {
    list: async (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const res = await fetch(`${BASE_URL}/transactions?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (txData) => {
      const res = await fetch(`${BASE_URL}/transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(txData),
      });
      return handleResponse(res);
    },
    update: async (id, txData) => {
      const res = await fetch(`${BASE_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(txData),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getExportUrl: () => `${BASE_URL}/transactions/export/csv`,
  },

  // Budgets
  budgets: {
    getOverview: async (monthYear) => {
      const query = monthYear ? `?month_year=${monthYear}` : '';
      const res = await fetch(`${BASE_URL}/budgets${query}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    save: async (budgetData) => {
      const res = await fetch(`${BASE_URL}/budgets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(budgetData),
      });
      return handleResponse(res);
    },
    update: async (id, monthlyLimit) => {
      const res = await fetch(`${BASE_URL}/budgets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ monthly_limit: monthlyLimit }),
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${BASE_URL}/budgets/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getAiRecommendations: async () => {
      const res = await fetch(`${BASE_URL}/budgets/ai-recommendations`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // AI Assistant
  ai: {
    getQuickPrompts: async () => {
      const res = await fetch(`${BASE_URL}/ai/quick-prompts`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${BASE_URL}/ai/history`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    sendMessage: async (message) => {
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message }),
      });
      return handleResponse(res);
    },
    resetChat: async () => {
      const res = await fetch(`${BASE_URL}/ai/reset-chat`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Fraud Detection
  fraud: {
    getOverview: async () => {
      const res = await fetch(`${BASE_URL}/fraud/overview`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    scanNow: async () => {
      const res = await fetch(`${BASE_URL}/fraud/scan-now`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    resolveAlert: async (alertId, action = 'REVIEWED') => {
      const res = await fetch(`${BASE_URL}/fraud/resolve/${alertId}?action=${action}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    analyzeFile: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/fraud/analyze-file`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
  },

  // Financial Analytics
  analytics: {
    getDeepDive: async () => {
      const res = await fetch(`${BASE_URL}/analytics/deep-dive`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getReport: async () => {
      const res = await fetch(`${BASE_URL}/analytics/report`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Bank Upload / SMS Analyzer
  upload: {
    uploadCsv: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/upload/csv`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
    parseSms: async (smsText) => {
      const res = await fetch(`${BASE_URL}/upload/sms`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sms_text: smsText }),
      });
      return handleResponse(res);
    },
    commit: async (transactions) => {
      const res = await fetch(`${BASE_URL}/upload/commit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ transactions }),
      });
      return handleResponse(res);
    },
  },

  // Settings
  settings: {
    getStatus: async () => {
      const res = await fetch(`${BASE_URL}/settings/status`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    updateProfile: async (profileData) => {
      const res = await fetch(`${BASE_URL}/settings/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData),
      });
      return handleResponse(res);
    },
    setGeminiKey: async (apiKey) => {
      const res = await fetch(`${BASE_URL}/settings/set-gemini-key`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ api_key: apiKey }),
      });
      return handleResponse(res);
    },
    resetDemoData: async () => {
      const res = await fetch(`${BASE_URL}/settings/reset-demo-data`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
};
