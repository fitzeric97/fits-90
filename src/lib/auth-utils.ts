/**
 * Get the correct base URL for authentication redirects
 * Always returns the production URL to avoid localhost issues
 */
export const getAuthBaseUrl = (): string => {
  // Use the current origin to ensure the app works in all environments
  return window.location.origin;
};

/**
 * Get the correct redirect URL for a given path
 */
export const getAuthRedirectUrl = (path: string = '/home'): string => {
  return `${getAuthBaseUrl()}${path}`;
};