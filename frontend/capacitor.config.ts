import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.superapp.core',
  appName: 'SuperApp',
  webDir: 'out',
  server: {
    // For development: point to your local Next.js dev server
    // Remove/comment this block for production APK builds
    // url: 'http://192.168.1.x:3000',
    // cleartext: true,
  },
  android: {
    // Set allowMixedContent: true during development if your backend runs on HTTP.
    // Keep false (default) for production builds with HTTPS backend.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0f',
    },
  },
};

export default config;
