import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.trustline.mobile',
  appName: 'Trustline',
  webDir: 'public',
  server: {
    url: 'https://trustline365.vercel.app',
    cleartext: true
  }
};

export default config;
