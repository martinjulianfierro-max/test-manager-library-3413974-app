const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const authStorage = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  },
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export async function apiRequest(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.message || (typeof data === 'string' ? data : `Error HTTP ${res.status}`);
    const errorCode = data?.code || `HTTP_${res.status}`;
    const err = new Error(errorMsg);
    err.code = errorCode;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  login: async (username, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    authStorage.setAuth(res.access_token, res.user);
    return res;
  },
  logout: () => {
    authStorage.clear();
  },
  getCategories: () => apiRequest('/categories'),
  getBooks: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.append('q', params.q);
    if (params.category_id) qs.append('category_id', params.category_id);
    if (params.available_only) qs.append('available_only', 'true');
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/books${query}`);
  },
  createBook: (data) => apiRequest('/books', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateBook: (id, data) => apiRequest(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteBook: (id) => apiRequest(`/books/${id}`, {
    method: 'DELETE',
  }),
  uploadCover: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('_method', 'PUT');
    return apiRequest(`/books/${id}/cover`, {
      method: 'POST',
      body: formData,
    });
  },
  deleteCover: (id) => apiRequest(`/books/${id}/cover`, {
    method: 'DELETE',
  }),
  getMembers: (q = '') => {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiRequest(`/members${query}`);
  },
  createMember: (data) => apiRequest('/members', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getLoans: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.from) qs.append('from', params.from);
    if (params.to) qs.append('to', params.to);
    if (params.status) qs.append('status', params.status);
    if (params.member_id) qs.append('member_id', params.member_id);
    if (params.page) qs.append('page', params.page);
    if (params.size) qs.append('size', params.size);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/loans${query}`);
  },
  createLoan: (memberId, bookIds, loanedAt = null) => {
    const payload = {
      member_id: memberId,
      items: bookIds.map(id => ({ book_id: id })),
    };
    if (loanedAt) payload.loaned_at = loanedAt;
    return apiRequest('/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  returnLoanItem: (loanId, itemId) => apiRequest(`/loans/${loanId}/items/${itemId}/return`, {
    method: 'POST',
  }),
  getOverdueLoans: () => apiRequest('/loans/overdue'),
  getMostBorrowedReport: (from, to) => {
    const qs = new URLSearchParams();
    if (from) qs.append('from', from);
    if (to) qs.append('to', to);
    return apiRequest(`/reports/most-borrowed?${qs.toString()}`);
  },
  createLibrarian: (username, password) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role: 'librarian' }),
  }),
};

