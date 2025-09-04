import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.fits.90',
  appName: 'fits-90',
  webDir: 'dist',
  // Comment out server config for native iOS app
  // Uncomment for development with hot reload from Lovable
  // server: {
  //   url: "https://020860e3-48a9-44e3-9426-735365ec659b.lovableproject.com?forceHideBadge=true",
  //   cleartext: true
  // }
};

export default config;
