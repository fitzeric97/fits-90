/**
 * iOS-optimized Apple Sign-In component for PWA
 * Handles iOS Safari PWA-specific OAuth redirect challenges
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase-ios-client';
import { serviceWorkerManager } from '@/lib/service-worker';

interface AppleSignInProps {
  onLoading?: (loading: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function AppleSignIn({ onLoading, onError, className = '', children }: AppleSignInProps) {
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setLoading(true);
    onLoading?.(true);
    
    try {
      // Detect if we're in iOS PWA mode
      const isIOSPWA = serviceWorkerManager.isIOSPWA();
      const isIOS = serviceWorkerManager.isIOS();
      
      console.log('Apple Sign-In attempt:', { isIOSPWA, isIOS });

      // Prepare redirect URL optimized for iOS PWA
      let redirectTo = `${window.location.origin}/auth/callback`;
      
      // For iOS PWA, we need to handle the redirect more carefully
      if (isIOSPWA) {
        // Store current state for recovery after redirect
        sessionStorage.setItem('pre-auth-url', window.location.href);
        sessionStorage.setItem('auth-attempt-timestamp', Date.now().toString());
        
        // Use a more specific redirect URL for PWA
        redirectTo = `${window.location.origin}/auth/callback?mode=pwa&platform=ios`;
      }

      // Additional OAuth options for iOS compatibility
      const oauthOptions = {
        redirectTo,
        queryParams: {
          // Help with iOS Safari PWA redirects
          display: isIOSPWA ? 'popup' : 'page',
          prompt: 'select_account', // Always show account selection on iOS
        },
        // Skip confirmation page when possible
        skipBrowserRedirect: false,
        // Force PKCE flow for better security on mobile
        flowType: 'pkce' as const,
      };

      console.log('Apple OAuth options:', oauthOptions);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: oauthOptions
      });

      if (signInError) {
        throw signInError;
      }

      // For iOS PWA, the redirect might not work as expected
      // Set a timeout to detect if we're still on the same page
      if (isIOSPWA) {
        setTimeout(() => {
          // If we're still here after 3 seconds, something might be wrong
          const currentTimestamp = sessionStorage.getItem('auth-attempt-timestamp');
          if (currentTimestamp && Date.now() - parseInt(currentTimestamp) > 3000) {
            console.warn('Apple Sign-In redirect may have failed in iOS PWA mode');
            setLoading(false);
            onLoading?.(false);
            onError?.('Sign in is taking longer than expected. Please try again.');
          }
        }, 3000);
      }

    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      setLoading(false);
      onLoading?.(false);
      onError?.(error.message || 'Apple Sign-In failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleAppleSignIn}
      disabled={loading}
      className={`
        w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 
        rounded-lg flex items-center justify-center space-x-2 
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
        ${className}
      `}
      aria-label="Sign in with Apple"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        children || (
          <>
            <AppleIcon />
            <span>Sign in with Apple</span>
          </>
        )
      )}
    </button>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
    </svg>
  );
}