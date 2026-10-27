import { registerRootComponent } from 'expo';
import { I18nManager, Platform } from 'react-native';

import App from './App';
import appIcon from './assets/icon.png';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.body.dir = 'rtl';

  const rtlStyle = document.createElement('style');
  rtlStyle.textContent = 'html, body, #root { direction: rtl !important; }';
  document.head.appendChild(rtlStyle);

  const setMetaTag = (name, content) => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  setMetaTag('apple-mobile-web-app-capable', 'yes');
  setMetaTag('apple-mobile-web-app-title', 'ST Paisios');
  setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');

  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = typeof appIcon === 'string' ? appIcon : appIcon.uri;
}

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
