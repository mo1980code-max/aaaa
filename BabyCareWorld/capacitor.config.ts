import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.babycare.world',
  appName: 'Baby Care World',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    // Force landscape orientation
    overrideUserAgent: 'Baby Care World Android',
    backgroundColor: '#87CEEB',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#87CEEB',
      overlaysWebView: true
    },
    Keyboard: {
      resize: 'none'
    }
  }
};

export default config;
