import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nour.app',
  appName: 'Nour',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
    // In dev mode, load from Vite dev server
    // url: 'http://192.168.1.100:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a1a14',
      showSpinner: true,
      spinnerColor: '#cfa14a',
    },
    LocalNotifications: {
      smallIcon: 'icon',
      iconColor: '#cfa14a',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a1a14',
    preferredContentMode: 'mobile',
  },
};

export default config;
