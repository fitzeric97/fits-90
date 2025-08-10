import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.08f391db8e8541a6b6ae20821228cf40',
  appName: 'fits-fashion-forward',
  webDir: 'dist',
  server: {
    url: 'https://08f391db-8e85-41a6-b6ae-20821228cf40.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;