import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'golf.nassau',
  appName: 'Nassau Golf',
  webDir: 'out',
  server: {
    // Fastest path to App Store: native shell wraps the live web app.
    // Comment out `url` and rebuild to ship bundled static files instead.
    url: 'https://nassau.golf',
    allowNavigation: ['nassau.golf', '*.nassau.golf'],
  },
  ios: {
    scheme: 'Nassau Golf',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#18181B',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#18181B',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#18181B',
      showSpinner: false,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
