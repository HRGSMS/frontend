export const apiBaseURL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
).replace(/\/$/, '');
export const authBaseURL = (
  import.meta.env.VITE_AUTH_BASE_URL ||
  `${new URL(apiBaseURL, window.location.origin).origin}/api/auth`
).replace(/\/$/, '');
export const socketURL =
  import.meta.env.VITE_SOCKET_URL || new URL(apiBaseURL, window.location.origin).origin;
