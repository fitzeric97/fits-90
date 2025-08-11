/**
 * Get the correct base URL for authentication redirects
 * Always returns the production URL to avoid localhost issues
 */
export const getAuthBaseUrl = (): string => {
  // Always use the production URL for authentication redirects
  return 'https://myfits.co';
};

/**
 * Get the correct redirect URL for a given path
 */
export const getAuthRedirectUrl = (path: string = '/home'): string => {
  return `${getAuthBaseUrl()}${path}`;
};