import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fits.app',
  appName: 'fits-90',
  webDir: 'dist',
  server: {
    url: 'https://020860e3-48a9-44e3-9426-735365ec659b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
