const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers
    }
  });

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ||
        `API request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export { API_BASE_URL };
