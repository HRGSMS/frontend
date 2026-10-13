import axios from 'axios';
export function requestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.error ?? error.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return error instanceof Error ? error.message : 'The request failed. Please try again.';
}
